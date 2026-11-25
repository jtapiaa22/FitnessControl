import { useEffect, useState, type FormEvent } from 'react'
import type { Alumno } from '@shared/tipos'

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState<string | null>(null)

  const cargar = () => window.api.alumnos.listar().then(setAlumnos).catch((e: Error) => setError(e.message))

  useEffect(() => {
    void cargar()
  }, [])

  async function agregar(e: FormEvent) {
    e.preventDefault()
    const n = nombre.trim()
    if (!n) return
    try {
      await window.api.alumnos.crear({
        nombre: n,
        telefono: null,
        fechaNacimiento: null,
        sexo: null,
        notas: null,
        alturaM: null,
        objetivo: 'mantener',
        frecuenciaDias: 7
      })
      setNombre('')
      await cargar()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section>
      <h1>Alumnos</h1>
      <form onSubmit={agregar} className="fila">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del alumno" />
        <button type="submit">Agregar</button>
      </form>
      {error && <p className="error">{error}</p>}
      {alumnos.length === 0 ? (
        <p className="tenue">Todavía no hay alumnos cargados.</p>
      ) : (
        <ul className="lista">
          {alumnos.map((a) => (
            <li key={a.id}>{a.nombre}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
