import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { estadoDeControl } from '@shared/controlPendiente'
import { formatearFecha, hoyLocal } from '@shared/formato'
import type { AlumnoConResumen } from '@shared/tipos'
import EstadoControl from '../components/EstadoControl'

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState<AlumnoConResumen[]>([])
  const [verArchivados, setVerArchivados] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navegar = useNavigate()

  useEffect(() => {
    window.api.alumnos
      .listar({ incluirArchivados: verArchivados })
      .then(setAlumnos)
      .catch((e: Error) => setError(e.message))
  }, [verArchivados])

  const hoy = hoyLocal()
  const filtro = busqueda.trim().toLocaleLowerCase('es')
  const visibles = alumnos.filter((a) => a.nombre.toLocaleLowerCase('es').includes(filtro))

  return (
    <section>
      <div className="encabezado">
        <h1>Alumnos</h1>
        <Link className="boton" to="/alumnos/nuevo">
          + Nuevo alumno
        </Link>
      </div>

      <div className="fila">
        <input placeholder="Buscar por nombre" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <label className="check">
          <input type="checkbox" checked={verArchivados} onChange={(e) => setVerArchivados(e.target.checked)} />
          Mostrar archivados
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      {visibles.length === 0 ? (
        <p className="tenue">{alumnos.length === 0 ? 'Todavía no hay alumnos cargados.' : 'Ningún alumno coincide con la búsqueda.'}</p>
      ) : (
        <table className="tabla clicable">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Controles</th>
              <th>Último control</th>
              <th>Próximo control</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((a) => (
              <tr key={a.id} onClick={() => navegar(`/alumnos/${a.id}`)}>
                <td>
                  {a.nombre} {a.archivado && <span className="etiqueta gris">Archivado</span>}
                </td>
                <td>{a.cantidadControles}</td>
                <td>{formatearFecha(a.ultimoControl)}</td>
                <td>
                  {a.archivado ? (
                    '—'
                  ) : (
                    <EstadoControl estado={estadoDeControl({ ultimoControl: a.ultimoControl, frecuenciaDias: a.frecuenciaDias, hoy })} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
