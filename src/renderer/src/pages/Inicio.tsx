import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { estadoDeControl, type EstadoDeControl } from '@shared/controlPendiente'
import { formatearFecha, hoyLocal } from '@shared/formato'
import type { AlumnoConResumen } from '@shared/tipos'
import EstadoControl from '../components/EstadoControl'

type Fila = { alumno: AlumnoConResumen; estado: EstadoDeControl }

export default function Inicio() {
  const [filas, setFilas] = useState<Fila[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navegar = useNavigate()

  useEffect(() => {
    const hoy = hoyLocal()
    window.api.alumnos
      .listar()
      .then((alumnos) =>
        setFilas(
          alumnos
            .map((alumno) => ({
              alumno,
              estado: estadoDeControl({ ultimoControl: alumno.ultimoControl, frecuenciaDias: alumno.frecuenciaDias, hoy })
            }))
            .filter((f) => f.estado.pendiente)
            // Los más atrasados primero; los que nunca tuvieron Control, al final.
            .sort((a, b) => (b.estado.proximaFecha ? b.estado.diasDeAtraso : -1) - (a.estado.proximaFecha ? a.estado.diasDeAtraso : -1))
        )
      )
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <section>
      <h1>Inicio</h1>
      <h2>Les toca control</h2>
      {error && <p className="error">{error}</p>}
      {filas === null ? (
        <p className="tenue">Cargando…</p>
      ) : filas.length === 0 ? (
        <p className="tenue">
          Nadie tiene controles pendientes. <Link to="/alumnos">Ver alumnos</Link>
        </p>
      ) : (
        <table className="tabla clicable">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Último control</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ alumno, estado }) => (
              <tr key={alumno.id} onClick={() => navegar(`/alumnos/${alumno.id}`)}>
                <td>{alumno.nombre}</td>
                <td>{formatearFecha(alumno.ultimoControl)}</td>
                <td>
                  <EstadoControl estado={estado} />
                </td>
                <td className="derecha">
                  <Link className="boton chico" to={`/alumnos/${alumno.id}/controles/nuevo`} onClick={(e) => e.stopPropagation()}>
                    Cargar control
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
