import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { masaGrasaKg } from '@shared/calculos'
import { compararControles, type FilaComparacion } from '@shared/comparacion'
import { ETIQUETA_CAMPO } from '@shared/etiquetas'
import { formatearFecha, formatearNumero, hoyLocal } from '@shared/formato'
import { CAMPOS_REPORTE, DATOS_PUBLICOS, type Alumno, type CampoReporte, type Configuracion, type Control } from '@shared/tipos'
import GraficoEvolucion, { type Serie } from '../components/GraficoEvolucion'
import TablaComparacion from '../components/TablaComparacion'

const GRUPOS: { titulo: string; campos: CampoReporte[] }[] = [
  { titulo: 'Balanza', campos: ['peso', 'imc', 'grasaPct', 'masaGrasa', 'musculo', 'grasaVisceral', 'masaOsea', 'proteinaPct', 'metabolismoBasal'] },
  { titulo: 'Medidas', campos: ['pecho', 'cintura', 'cadera', 'muslo', 'brazoRelajado', 'brazoContraido'] }
]

/** Datos destacados arriba del Reporte, si están elegidos. */
const DESTACADOS: CampoReporte[] = ['peso', 'masaGrasa', 'musculo', 'cintura']

/** Ancho de la hoja A4 en pantalla (96 ppp). */
const ANCHO_HOJA = 794

/** Ancho útil de una hoja A4 con márgenes de 0,4": unos 715 px. */
const ANCHO_GRAFICO = 700

/**
 * Reporte en PDF para el Alumno: la Instructora elige qué datos van y escribe
 * una nota; la vista previa es exactamente lo que se imprime.
 * Ruta: /alumnos/:id/reporte?base=&actual=
 */
export default function Reporte() {
  const { id } = useParams() as { id: string }
  const [params] = useSearchParams()
  const [alumno, setAlumno] = useState<Alumno | null>(null)
  const [controles, setControles] = useState<Control[] | null>(null)
  const [config, setConfig] = useState<Configuracion | null>(null)
  const [campos, setCampos] = useState<CampoReporte[]>([...DATOS_PUBLICOS])
  const [nota, setNota] = useState('')
  const [estado, setEstado] = useState<{ tipo: 'ok'; ruta: string } | { tipo: 'error'; mensaje: string } | null>(null)
  const [generando, setGenerando] = useState(false)
  // La vista previa se achica para entrar en la ventana; el PDF siempre sale en tamaño real.
  const contenedor = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(1)
  useEffect(() => {
    const el = contenedor.current
    if (!el) return
    const medir = () => setEscala(Math.min(1, el.clientWidth / ANCHO_HOJA))
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    medir()
    return () => observador.disconnect()
  }, [alumno, controles, config])

  useEffect(() => {
    Promise.all([window.api.alumnos.obtener(id), window.api.controles.listarPorAlumno(id), window.api.configuracion.obtener()]).then(
      ([a, c, cfg]) => {
        setAlumno(a)
        setControles(c)
        setConfig(cfg)
        if (a?.camposReporte) setCampos(a.camposReporte)
      }
    )
  }, [id])

  const n = controles?.length ?? 0
  const indiceBase = Math.min(Math.max(Number(params.get('base') ?? n - 1), 1), n) - 1
  const indiceActual = Math.min(Math.max(Number(params.get('actual') ?? n), 1), n) - 1
  const base = controles?.[indiceBase]
  const actual = controles?.[indiceActual]

  useEffect(() => {
    setNota(actual?.notaReporte ?? '')
  }, [actual?.id])

  const filas = useMemo(() => (base && actual ? compararControles(base, actual) : []), [base, actual])
  const datos = useMemo(
    () =>
      (controles ?? []).slice(0, indiceActual + 1).map((c, i) => ({
        n: i + 1,
        fecha: c.fecha,
        peso: c.pesoKg,
        masaGrasa: masaGrasaKg(c.pesoKg, c.grasaPct),
        musculo: c.musculoKg,
        pecho: c.pechoCm,
        cintura: c.cinturaCm,
        cadera: c.caderaCm
      })),
    [controles, indiceActual]
  )

  if (!alumno || !controles || !config) return <p className="tenue">Cargando…</p>
  if (!base || !actual || n < 2) {
    return (
      <section>
        <Link to={`/alumnos/${id}`} className="volver">
          ← {alumno.nombre}
        </Link>
        <p className="tenue">Hacen falta al menos dos controles para armar un reporte.</p>
      </section>
    )
  }

  const alternar = (campo: CampoReporte) =>
    setCampos((prev) => (prev.includes(campo) ? prev.filter((c) => c !== campo) : CAMPOS_REPORTE.filter((c) => c === campo || prev.includes(c))))

  async function guardarPdf() {
    if (!alumno || !actual) return
    setGenerando(true)
    setEstado(null)
    try {
      // Se guardan la nota (con el Control) y la selección de datos (con el Alumno).
      await window.api.controles.actualizar(actual.id, { notaReporte: nota.trim() || null })
      await window.api.alumnos.actualizar(alumno.id, { camposReporte: campos })
      const ruta = await window.api.reporte.guardarPdf(`Reporte ${alumno.nombre} ${actual.fecha}`)
      if (ruta) setEstado({ tipo: 'ok', ruta })
    } catch (e) {
      setEstado({ tipo: 'error', mensaje: (e as Error).message })
    } finally {
      setGenerando(false)
    }
  }

  const elegidos = (series: (Serie & { campo: CampoReporte })[]) => series.filter((s) => campos.includes(s.campo))
  const seriesComposicion = elegidos([
    { clave: 'masaGrasa', nombre: 'Masa grasa', campo: 'masaGrasa' },
    { clave: 'musculo', nombre: 'Músculo', campo: 'musculo' }
  ])
  const seriesMedidas = elegidos([
    { clave: 'pecho', nombre: 'Pecho', campo: 'pecho' },
    { clave: 'cintura', nombre: 'Cintura', campo: 'cintura' },
    { clave: 'cadera', nombre: 'Cadera', campo: 'cadera' }
  ])
  const marcar = [indiceBase + 1, indiceActual + 1]

  return (
    <div className="pantalla-reporte">
      <aside className="panel-reporte">
        <Link to={`/alumnos/${id}/comparar?base=${indiceBase + 1}&actual=${indiceActual + 1}`} className="volver">
          ← Comparación
        </Link>
        <h1>Reporte</h1>
        {!config.nombreInstructora && (
          <p className="nota-config">
            Todavía no cargaste tu nombre ni tu logo. <Link to="/configuracion">Configurar</Link>
          </p>
        )}
        <div className="grupos">
        {GRUPOS.map((g) => (
          <fieldset key={g.titulo}>
            <legend>{g.titulo}</legend>
            {g.campos.map((c) => (
              <label key={c} className="check">
                <input type="checkbox" checked={campos.includes(c)} onChange={() => alternar(c)} />
                {ETIQUETA_CAMPO[c].nombre}
                {!DATOS_PUBLICOS.includes(c) && <span className="etiqueta gris privado">solo vos</span>}
              </label>
            ))}
          </fieldset>
        ))}
        </div>
        <label className="campo">
          <span className="campo-etiqueta">Nota para {alumno.nombre.split(' ')[0]}</span>
          <textarea rows={5} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej.: ¡Muy bien esta semana! Seguimos con…" />
        </label>
        <button onClick={guardarPdf} disabled={generando}>
          {generando ? 'Generando…' : 'Guardar PDF'}
        </button>
        {estado?.tipo === 'ok' && (
          <div className="resultado">
            <span>PDF guardado.</span>
            <div className="acciones">
              <button className="secundario chico" onClick={() => window.api.reporte.abrir(estado.ruta)}>
                Abrir
              </button>
              <button className="secundario chico" onClick={() => window.api.reporte.mostrarEnCarpeta(estado.ruta)}>
                Mostrar en carpeta
              </button>
            </div>
          </div>
        )}
        {estado?.tipo === 'error' && <p className="error">{estado.mensaje}</p>}
      </aside>

      <div className="vista-previa" ref={contenedor}>
      <article className="hoja" style={{ zoom: escala }}>
        <header className="hoja-encabezado">
          <div className="hoja-marca">
            {config.logo && <img src={config.logo} alt="" className="hoja-logo" />}
            <div>
              <div className="hoja-instructora">{config.nombreInstructora ?? ''}</div>
              {config.contacto && <div className="tenue">{config.contacto}</div>}
            </div>
          </div>
          <div className="hoja-titulo">
            <div className="hoja-etiqueta">Reporte de progreso</div>
            <div className="hoja-alumno">{alumno.nombre}</div>
            <div className="tenue">
              Control {indiceBase + 1} ({formatearFecha(base.fecha)}) → Control {indiceActual + 1} ({formatearFecha(actual.fecha)})
            </div>
          </div>
        </header>

        <Destacados filas={filas} campos={campos} />

        <h2>Comparación</h2>
        <TablaComparacion filas={filas} base={base} actual={actual} campos={campos} enReporte />

        {(campos.includes('peso') || seriesComposicion.length > 0 || seriesMedidas.length > 0) && <h2>Evolución</h2>}
        <div className="hoja-graficos">
          {campos.includes('peso') && (
            <GraficoEvolucion titulo="Peso" unidad="kg" decimales={2} datos={datos} series={[{ clave: 'peso', nombre: 'Peso' }]} marcar={marcar} ancho={ANCHO_GRAFICO} alto={200} />
          )}
          {seriesComposicion.length > 0 && (
            <GraficoEvolucion titulo="Masa grasa y músculo" unidad="kg" decimales={2} datos={datos} series={seriesComposicion} marcar={marcar} ancho={ANCHO_GRAFICO} alto={210} />
          )}
          {seriesMedidas.length > 0 && (
            <GraficoEvolucion titulo="Medidas" unidad="cm" datos={datos} series={seriesMedidas} marcar={marcar} ancho={ANCHO_GRAFICO} alto={210} />
          )}
        </div>

        {nota.trim() && (
          <section className="hoja-nota">
            <h2>Nota</h2>
            <p>{nota.trim()}</p>
          </section>
        )}

        <footer className="hoja-pie">Generado el {formatearFecha(hoyLocal())}</footer>
      </article>
      </div>
    </div>
  )
}

/** Hasta 4 números grandes con su diferencia, para leer de un vistazo. */
function Destacados({ filas, campos }: { filas: FilaComparacion[]; campos: CampoReporte[] }) {
  const elegidas = DESTACADOS.filter((c) => campos.includes(c))
    .map((c) => filas.find((f) => f.campo === c && f.actual !== null))
    .filter((f): f is FilaComparacion => f !== undefined)
  if (elegidas.length === 0) return null
  return (
    <div className="destacados">
      {elegidas.map((f) => {
        const { nombre, unidad, decimales } = ETIQUETA_CAMPO[f.campo]
        return (
          <div key={f.campo} className="destacado">
            <div className="destacado-nombre">{nombre}</div>
            <div className="destacado-valor">
              {formatearNumero(f.actual, decimales)} <span className="destacado-unidad">{unidad}</span>
            </div>
            {f.diferencia !== null && (
              <div className={`cambio ${f.cambio}`}>
                <span className="flecha" aria-hidden>
                  {f.cambio === 'sube' ? '▲' : f.cambio === 'baja' ? '▼' : '='}
                </span>
                {f.diferencia > 0 ? '+' : ''}
                {formatearNumero(f.diferencia, decimales)} {unidad}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
