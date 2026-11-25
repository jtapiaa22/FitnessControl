import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { alturaEnMetros, imc, masaGrasaKg, type UnidadAltura } from '@shared/calculos'
import { avisosDeControl, type CampoNumerico } from '@shared/avisos'
import { formatearFecha, formatearNumero, hoyLocal, parsearNumero } from '@shared/formato'
import type { Alumno, Control, ControlNuevo } from '@shared/tipos'
import CampoNumero from '../components/CampoNumero'

type Lado = 'izq' | 'der'

const BALANZA: { campo: CampoNumerico; etiqueta: string; unidad: string }[] = [
  { campo: 'pesoKg', etiqueta: 'Peso', unidad: 'kg' },
  { campo: 'grasaPct', etiqueta: 'Grasa corporal', unidad: '%' },
  { campo: 'musculoKg', etiqueta: 'Músculo', unidad: 'kg' },
  { campo: 'grasaVisceral', etiqueta: 'Grasa visceral', unidad: '' },
  { campo: 'masaOseaKg', etiqueta: 'Masa ósea', unidad: 'kg' },
  { campo: 'proteinaPct', etiqueta: 'Proteína', unidad: '%' },
  { campo: 'metabolismoBasalKcal', etiqueta: 'Metabolismo basal', unidad: 'kcal' }
]

const TRONCO: { campo: CampoNumerico; etiqueta: string }[] = [
  { campo: 'pechoCm', etiqueta: 'Pecho' },
  { campo: 'cinturaCm', etiqueta: 'Cintura' },
  { campo: 'caderaCm', etiqueta: 'Cadera' }
]

const EXTREMIDADES: { etiqueta: string; izq: CampoNumerico; der: CampoNumerico }[] = [
  { etiqueta: 'Muslo', izq: 'musloIzqCm', der: 'musloDerCm' },
  { etiqueta: 'Brazo relajado', izq: 'brazoRelajadoIzqCm', der: 'brazoRelajadoDerCm' },
  { etiqueta: 'Brazo contraído', izq: 'brazoContraidoIzqCm', der: 'brazoContraidoDerCm' }
]

const CAMPOS_NUMERICOS: CampoNumerico[] = [
  ...BALANZA.map((b) => b.campo),
  ...TRONCO.map((t) => t.campo),
  ...EXTREMIDADES.flatMap((e) => [e.izq, e.der])
]

/** Qué lado midió un Control de un solo lado (izquierdo si no hay nada cargado). */
function ladoDe(c: Control): Lado {
  const izq = EXTREMIDADES.some((e) => c[e.izq] !== null)
  const der = EXTREMIDADES.some((e) => c[e.der] !== null)
  return der && !izq ? 'der' : 'izq'
}

const aTexto = (v: number | null, decimales = 2): string => (v === null ? '' : formatearNumero(v, decimales).replace(/\./g, ''))

/** Alta y edición de un Control. Ruta: /alumnos/:id/controles/nuevo o /alumnos/:id/controles/:controlId. */
export default function ControlForm() {
  const { id: alumnoId, controlId } = useParams() as { id: string; controlId?: string }
  const navegar = useNavigate()
  const [alumno, setAlumno] = useState<Alumno | null>(null)
  const [controles, setControles] = useState<Control[]>([])
  const [fecha, setFecha] = useState(hoyLocal())
  const [altura, setAltura] = useState('')
  const [unidadAltura, setUnidadAltura] = useState<UnidadAltura>('m')
  const [valores, setValores] = useState<Partial<Record<CampoNumerico, string>>>({})
  const [ambosLados, setAmbosLados] = useState(false)
  const [lado, setLado] = useState<Lado>('izq')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    Promise.all([window.api.alumnos.obtener(alumnoId), window.api.controles.listarPorAlumno(alumnoId)])
      .then(([a, cs]) => {
        setAlumno(a)
        setControles(cs)
        const editado = controlId ? cs.find((c) => c.id === controlId) : undefined
        if (editado) {
          setFecha(editado.fecha)
          setAltura(aTexto(editado.alturaM))
          setValores(Object.fromEntries(CAMPOS_NUMERICOS.map((k) => [k, aTexto(editado[k] as number | null)])))
          setAmbosLados(editado.ambosLados)
          setLado(ladoDe(editado))
        } else {
          // Nuevo Control: altura del Alumno y misma forma de medir que el último Control.
          setAltura(aTexto(a?.alturaM ?? null))
          const ultimo = cs.at(-1)
          if (ultimo) {
            setAmbosLados(ultimo.ambosLados)
            setLado(ladoDe(ultimo))
          }
        }
      })
      .catch((e: Error) => setError(e.message))
  }, [alumnoId, controlId])

  // El Control anterior (por fecha) al que se está cargando, para los avisos de salto.
  const anterior = useMemo(
    () => controles.filter((c) => c.id !== controlId && c.fecha <= fecha).at(-1) ?? null,
    [controles, controlId, fecha]
  )

  const numeros = useMemo(() => {
    const n: Partial<Record<CampoNumerico, number | null>> = {}
    for (const k of CAMPOS_NUMERICOS) n[k] = parsearNumero(valores[k] ?? '')
    // Midiendo un solo lado, el otro lado no se guarda.
    if (!ambosLados) for (const e of EXTREMIDADES) n[lado === 'izq' ? e.der : e.izq] = null
    const a = parsearNumero(altura)
    n.alturaM = a === null || Number.isNaN(a) ? a : alturaEnMetros(a, unidadAltura)
    return n
  }, [valores, ambosLados, lado, altura, unidadAltura])

  const avisos = useMemo(() => {
    const porCampo: Partial<Record<CampoNumerico, string>> = {}
    for (const a of avisosDeControl(numeros, anterior)) porCampo[a.campo] ??= a.mensaje
    return porCampo
  }, [numeros, anterior])

  const setValor = (campo: CampoNumerico) => (v: string) => setValores((prev) => ({ ...prev, [campo]: v }))

  function cambiarUnidad(nueva: UnidadAltura) {
    const v = parsearNumero(altura)
    if (v !== null && !Number.isNaN(v) && nueva !== unidadAltura) {
      setAltura(aTexto(nueva === 'cm' ? v * 100 : v / 100))
    }
    setUnidadAltura(nueva)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!fecha) return setError('La fecha es obligatoria.')
    if (Object.values(numeros).some((v) => typeof v === 'number' && Number.isNaN(v))) {
      return setError('Hay valores que no son números. Revisá los campos marcados.')
    }
    const datos = { ...numeros, fecha, ambosLados } as Omit<ControlNuevo, 'alumnoId' | 'notaReporte'>
    setGuardando(true)
    try {
      if (controlId) {
        await window.api.controles.actualizar(controlId, datos)
      } else {
        await window.api.controles.crear({ ...datos, alumnoId, notaReporte: null })
      }
      // La altura del Alumno se actualiza si cambió en este Control.
      if (alumno && numeros.alturaM !== null && numeros.alturaM !== undefined && numeros.alturaM !== alumno.alturaM) {
        await window.api.alumnos.actualizar(alumnoId, { alturaM: numeros.alturaM })
      }
      navegar(`/alumnos/${alumnoId}`, { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setGuardando(false)
    }
  }

  async function eliminar() {
    if (!controlId || !confirm(`¿Eliminar el control del ${formatearFecha(fecha)}? No se puede deshacer.`)) return
    await window.api.controles.eliminar(controlId)
    navegar(`/alumnos/${alumnoId}`, { replace: true })
  }

  if (!alumno) return error ? <p className="error">{error}</p> : <p className="tenue">Cargando…</p>

  const imcCalculado = imc(numeros.pesoKg, numeros.alturaM)
  const masaGrasa = masaGrasaKg(numeros.pesoKg, numeros.grasaPct)

  return (
    <section>
      <Link to={`/alumnos/${alumnoId}`} className="volver">
        ← {alumno.nombre}
      </Link>
      <h1>{controlId ? 'Editar control' : 'Nuevo control'}</h1>
      {anterior && <p className="tenue">Control anterior: {formatearFecha(anterior.fecha)}</p>}

      <form onSubmit={guardar} className="formulario">
        <div className="grilla">
          <label className="campo">
            <span className="campo-etiqueta">Fecha *</span>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label className={`campo ${avisos.alturaM ? 'con-aviso' : ''}`}>
            <span className="campo-etiqueta">Altura</span>
            <span className="campo-entrada">
              <input inputMode="decimal" value={altura} onChange={(e) => setAltura(e.target.value)} />
              <select value={unidadAltura} onChange={(e) => cambiarUnidad(e.target.value as UnidadAltura)} className="unidad-select">
                <option value="m">m</option>
                <option value="cm">cm</option>
              </select>
            </span>
            {avisos.alturaM && <span className="aviso">⚠ {avisos.alturaM}</span>}
          </label>
        </div>

        <fieldset>
          <legend>Balanza</legend>
          <div className="grilla">
            {BALANZA.map((b, i) => (
              <CampoNumero
                key={b.campo}
                etiqueta={b.etiqueta}
                unidad={b.unidad}
                valor={valores[b.campo] ?? ''}
                onChange={setValor(b.campo)}
                aviso={avisos[b.campo]}
                autoFocus={i === 0 && !controlId}
              />
            ))}
          </div>
          <p className="calculado">
            IMC: <strong>{formatearNumero(imcCalculado, 1)}</strong> · Masa grasa: <strong>{masaGrasa === null ? '—' : `${formatearNumero(masaGrasa, 2)} kg`}</strong>
          </p>
        </fieldset>

        <fieldset>
          <legend>Medidas (cm)</legend>
          <div className="grilla">
            {TRONCO.map((t) => (
              <CampoNumero key={t.campo} etiqueta={t.etiqueta} unidad="cm" valor={valores[t.campo] ?? ''} onChange={setValor(t.campo)} aviso={avisos[t.campo]} />
            ))}
          </div>

          <div className="fila lados">
            <label className="check">
              <input type="checkbox" checked={ambosLados} onChange={(e) => setAmbosLados(e.target.checked)} />
              Medir ambos lados
            </label>
            {!ambosLados && (
              <label className="check">
                Lado:
                <select value={lado} onChange={(e) => setLado(e.target.value as Lado)}>
                  <option value="izq">Izquierdo</option>
                  <option value="der">Derecho</option>
                </select>
              </label>
            )}
          </div>

          <div className="grilla">
            {EXTREMIDADES.flatMap((e) => {
              const lados: Lado[] = ambosLados ? ['izq', 'der'] : [lado]
              return lados.map((l) => {
                const campo = l === 'izq' ? e.izq : e.der
                const sufijo = ambosLados ? (l === 'izq' ? ' (izq.)' : ' (der.)') : ''
                return (
                  <CampoNumero key={campo} etiqueta={e.etiqueta + sufijo} unidad="cm" valor={valores[campo] ?? ''} onChange={setValor(campo)} aviso={avisos[campo]} />
                )
              })
            })}
          </div>
        </fieldset>

        {error && <p className="error">{error}</p>}
        <div className="acciones">
          <button type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar control'}
          </button>
          <button type="button" className="secundario" onClick={() => navegar(-1)}>
            Cancelar
          </button>
          {controlId && (
            <button type="button" className="peligro derecha" onClick={eliminar}>
              Eliminar control
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
