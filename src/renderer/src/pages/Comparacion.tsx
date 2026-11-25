import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { masaGrasaKg } from '@shared/calculos'
import { compararControles } from '@shared/comparacion'
import { formatearFecha } from '@shared/formato'
import type { Alumno, Control } from '@shared/tipos'
import DetalleMedida from '../components/DetalleMedida'
import FiguraMedidas, { type InteraccionFigura } from '../components/FiguraMedidas'
import type { ZonaMedida } from '../components/siluetas'
import GraficoEvolucion from '../components/GraficoEvolucion'
import TablaComparacion from '../components/TablaComparacion'

/**
 * Comparación entre dos Controles. Por defecto, el último contra el anterior;
 * la Instructora puede elegir cualquier par. Ruta: /alumnos/:id/comparar?base=&actual=
 */
export default function Comparacion() {
  const { id } = useParams() as { id: string }
  const [params, setParams] = useSearchParams()
  const [alumno, setAlumno] = useState<Alumno | null>(null)
  const [controles, setControles] = useState<Control[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Zona del cuerpo bajo el mouse (se resalta en las dos siluetas) y zona elegida con un clic.
  const [resaltada, setResaltada] = useState<ZonaMedida | null>(null)
  const [elegida, setElegida] = useState<ZonaMedida | null>(null)

  useEffect(() => {
    Promise.all([window.api.alumnos.obtener(id), window.api.controles.listarPorAlumno(id)])
      .then(([a, c]) => {
        setAlumno(a)
        setControles(c)
      })
      .catch((e: Error) => setError(e.message))
  }, [id])

  const n = controles?.length ?? 0
  const indiceBase = Math.min(Math.max(Number(params.get('base') ?? n - 1), 1), n) - 1
  const indiceActual = Math.min(Math.max(Number(params.get('actual') ?? n), 1), n) - 1
  const base = controles?.[indiceBase]
  const actual = controles?.[indiceActual]

  const datos = useMemo(
    () =>
      (controles ?? []).map((c, i) => ({
        n: i + 1,
        fecha: c.fecha,
        peso: c.pesoKg,
        masaGrasa: masaGrasaKg(c.pesoKg, c.grasaPct),
        musculo: c.musculoKg,
        pecho: c.pechoCm,
        cintura: c.cinturaCm,
        cadera: c.caderaCm
      })),
    [controles]
  )

  if (error) return <p className="error">{error}</p>
  if (!alumno || !controles) return <p className="tenue">Cargando…</p>

  const volver = (
    <Link to={`/alumnos/${id}`} className="volver">
      ← {alumno.nombre}
    </Link>
  )
  if (n < 2 || !base || !actual) {
    return (
      <section>
        {volver}
        <h1>Comparación</h1>
        <p className="tenue">Hacen falta al menos dos controles para comparar.</p>
      </section>
    )
  }

  const elegir = (clave: 'base' | 'actual') => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setParams({ base: String(indiceBase + 1), actual: String(indiceActual + 1), [clave]: e.target.value }, { replace: true })

  const interaccion: InteraccionFigura = {
    resaltada,
    elegida,
    alResaltar: setResaltada,
    // Tocar la misma zona otra vez cierra el detalle.
    alElegir: (zona) => setElegida((previa) => (previa === zona ? null : zona))
  }

  const opciones = controles.map((c, i) => (
    <option key={c.id} value={i + 1}>
      Control {i + 1} · {formatearFecha(c.fecha)}
    </option>
  ))

  return (
    <section>
      {volver}
      <h1>Comparación</h1>

      <div className="fila selector-controles">
        <label className="check">
          Desde
          <select value={indiceBase + 1} onChange={elegir('base')}>
            {opciones}
          </select>
        </label>
        <label className="check">
          Hasta
          <select value={indiceActual + 1} onChange={elegir('actual')}>
            {opciones}
          </select>
        </label>
        <Link className="boton derecha-auto" to={`/alumnos/${id}/reporte?base=${indiceBase + 1}&actual=${indiceActual + 1}`}>
          Armar reporte PDF
        </Link>
        {indiceBase !== n - 2 || indiceActual !== n - 1 ? (
          <button className="secundario chico" onClick={() => setParams({}, { replace: true })}>
            Último contra anterior
          </button>
        ) : null}
      </div>

      <TablaComparacion filas={compararControles(base, actual)} base={base} actual={actual} />

      <h2>Medidas en el cuerpo</h2>
      <p className="tenue ayuda-figuras">Pasá el mouse por una parte del cuerpo para compararla, o tocala para ver su detalle.</p>
      <div className="figuras">
        <FiguraMedidas
          titulo={`Control ${indiceBase + 1} · ${formatearFecha(base.fecha)}`}
          control={base}
          sexo={alumno.sexo}
          interaccion={interaccion}
        />
        <FiguraMedidas
          titulo={`Control ${indiceActual + 1} · ${formatearFecha(actual.fecha)}`}
          control={actual}
          sexo={alumno.sexo}
          filas={compararControles(base, actual)}
          interaccion={interaccion}
        />
      </div>
      {elegida && (
        <DetalleMedida zona={elegida} controles={controles} indiceBase={indiceBase} indiceActual={indiceActual} alCerrar={() => setElegida(null)} />
      )}

      <h2>Evolución</h2>
      <div className="graficos">
        <GraficoEvolucion titulo="Peso" unidad="kg" decimales={2} datos={datos} series={[{ clave: 'peso', nombre: 'Peso' }]} marcar={[indiceBase + 1, indiceActual + 1]} />
        <GraficoEvolucion
          titulo="Masa grasa y músculo"
          unidad="kg"
          decimales={2}
          datos={datos}
          series={[
            { clave: 'masaGrasa', nombre: 'Masa grasa' },
            { clave: 'musculo', nombre: 'Músculo' }
          ]}
          marcar={[indiceBase + 1, indiceActual + 1]}
        />
        <GraficoEvolucion
          titulo="Medidas"
          unidad="cm"
          datos={datos}
          series={[
            { clave: 'pecho', nombre: 'Pecho' },
            { clave: 'cintura', nombre: 'Cintura' },
            { clave: 'cadera', nombre: 'Cadera' }
          ]}
          marcar={[indiceBase + 1, indiceActual + 1]}
        />
      </div>
    </section>
  )
}
