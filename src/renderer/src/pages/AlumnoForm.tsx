import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { alturaEnMetros, type UnidadAltura } from '@shared/calculos'
import { ETIQUETA_OBJETIVO, ETIQUETA_SEXO } from '@shared/etiquetas'
import { formatearNumero, parsearNumero } from '@shared/formato'
import type { AlumnoNuevo, Objetivo, Sexo } from '@shared/tipos'

/** Alta y edición de un Alumno. Ruta: /alumnos/nuevo o /alumnos/:id/editar. */
export default function AlumnoForm() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [sexo, setSexo] = useState<Sexo | ''>('')
  const [altura, setAltura] = useState('')
  const [unidadAltura, setUnidadAltura] = useState<UnidadAltura>('m')
  const [objetivo, setObjetivo] = useState<Objetivo>('mantener')
  const [frecuencia, setFrecuencia] = useState('7')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    window.api.alumnos.obtener(id).then((a) => {
      if (!a) return
      setNombre(a.nombre)
      setTelefono(a.telefono ?? '')
      setFechaNacimiento(a.fechaNacimiento ?? '')
      setSexo(a.sexo ?? '')
      setAltura(a.alturaM === null ? '' : formatearNumero(a.alturaM, 2))
      setObjetivo(a.objetivo)
      setFrecuencia(String(a.frecuenciaDias))
      setNotas(a.notas ?? '')
    })
  }, [id])

  function cambiarUnidad(nueva: UnidadAltura) {
    const v = parsearNumero(altura)
    if (v !== null && !Number.isNaN(v) && nueva !== unidadAltura) {
      setAltura(formatearNumero(nueva === 'cm' ? v * 100 : v / 100, 2))
    }
    setUnidadAltura(nueva)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!nombre.trim()) return setError('El nombre es obligatorio.')
    const alturaNum = parsearNumero(altura)
    if (Number.isNaN(alturaNum)) return setError('La altura no es un número válido.')
    const frecuenciaDias = Number.parseInt(frecuencia, 10)
    if (!Number.isInteger(frecuenciaDias) || frecuenciaDias < 1) return setError('La frecuencia tiene que ser un número de días mayor a 0.')

    const datos: AlumnoNuevo = {
      nombre: nombre.trim(),
      telefono: telefono.trim() || null,
      fechaNacimiento: fechaNacimiento || null,
      sexo: sexo || null,
      notas: notas.trim() || null,
      alturaM: alturaEnMetros(alturaNum, unidadAltura),
      objetivo,
      frecuenciaDias
    }
    try {
      const alumno = id ? await window.api.alumnos.actualizar(id, datos) : await window.api.alumnos.crear(datos)
      navegar(`/alumnos/${alumno.id}`, { replace: true })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section>
      <h1>{id ? 'Editar alumno' : 'Nuevo alumno'}</h1>
      <form onSubmit={guardar} className="formulario">
        <div className="grilla">
          <label className="campo ancho">
            <span className="campo-etiqueta">Nombre y apellido *</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </label>
          <label className="campo">
            <span className="campo-etiqueta">Teléfono (WhatsApp)</span>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </label>
          <label className="campo">
            <span className="campo-etiqueta">Fecha de nacimiento</span>
            <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
          </label>
          <label className="campo">
            <span className="campo-etiqueta">Sexo</span>
            <select value={sexo} onChange={(e) => setSexo(e.target.value as Sexo | '')}>
              <option value="">—</option>
              {Object.entries(ETIQUETA_SEXO).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span className="campo-etiqueta">Altura</span>
            <span className="campo-entrada">
              <input inputMode="decimal" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder={unidadAltura === 'm' ? '1,65' : '165'} />
              <select value={unidadAltura} onChange={(e) => cambiarUnidad(e.target.value as UnidadAltura)} className="unidad-select">
                <option value="m">m</option>
                <option value="cm">cm</option>
              </select>
            </span>
          </label>
          <label className="campo">
            <span className="campo-etiqueta">Objetivo</span>
            <select value={objetivo} onChange={(e) => setObjetivo(e.target.value as Objetivo)}>
              {Object.entries(ETIQUETA_OBJETIVO).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span className="campo-etiqueta">Control cada</span>
            <span className="campo-entrada">
              <input inputMode="numeric" value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} />
              <span className="unidad">días</span>
            </span>
          </label>
          <label className="campo ancho">
            <span className="campo-etiqueta">Notas (lesiones, objetivos, etc.)</span>
            <textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="acciones">
          <button type="submit">Guardar</button>
          <button type="button" className="secundario" onClick={() => navegar(-1)}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
