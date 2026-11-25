import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { masaGrasaKg } from '@shared/calculos'
import { estadoDeControl } from '@shared/controlPendiente'
import { ETIQUETA_OBJETIVO, ETIQUETA_SEXO } from '@shared/etiquetas'
import { formatearFecha, formatearNumero, hoyLocal } from '@shared/formato'
import type { Alumno, Control } from '@shared/tipos'
import EstadoControl from '../components/EstadoControl'

export default function FichaAlumno() {
  const { id } = useParams() as { id: string }
  const navegar = useNavigate()
  const [alumno, setAlumno] = useState<Alumno | null>(null)
  const [controles, setControles] = useState<Control[]>([])
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([window.api.alumnos.obtener(id), window.api.controles.listarPorAlumno(id)])
      setAlumno(a)
      setControles(c)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [id])

  useEffect(() => {
    void cargar()
  }, [cargar])

  if (error) return <p className="error">{error}</p>
  if (!alumno) return <p className="tenue">Cargando…</p>

  const ultimo = controles.at(-1) ?? null
  const estado = estadoDeControl({ ultimoControl: ultimo?.fecha ?? null, frecuenciaDias: alumno.frecuenciaDias, hoy: hoyLocal() })

  async function archivar(archivado: boolean) {
    setAlumno(await window.api.alumnos.actualizar(id, { archivado }))
  }

  async function eliminar() {
    if (!alumno) return
    if (!confirm(`¿Eliminar a ${alumno.nombre} y sus ${controles.length} controles? Esta acción no se puede deshacer.`)) return
    if (!confirm(`Confirmá de nuevo: se borra todo el historial de ${alumno.nombre} para siempre.`)) return
    await window.api.alumnos.eliminar(id)
    navegar('/alumnos', { replace: true })
  }

  return (
    <section>
      <Link to="/alumnos" className="volver">
        ← Alumnos
      </Link>
      <div className="encabezado">
        <h1>
          {alumno.nombre} {alumno.archivado && <span className="etiqueta gris">Archivado</span>}
        </h1>
        <div className="acciones">
          {!alumno.archivado && (
            <Link className="boton" to={`/alumnos/${id}/controles/nuevo`}>
              + Nuevo control
            </Link>
          )}
          {controles.length >= 2 && (
            <Link className="boton secundario" to={`/alumnos/${id}/comparar`}>
              Comparar
            </Link>
          )}
          <Link className="boton secundario" to={`/alumnos/${id}/editar`}>
            Editar
          </Link>
          {alumno.archivado ? (
            <>
              <button className="secundario" onClick={() => archivar(false)}>
                Desarchivar
              </button>
              <button className="peligro" onClick={eliminar}>
                Eliminar definitivamente
              </button>
            </>
          ) : (
            <button className="secundario" onClick={() => archivar(true)}>
              Archivar
            </button>
          )}
        </div>
      </div>

      <div className="tarjeta datos">
        <Dato etiqueta="Teléfono" valor={alumno.telefono ?? '—'} />
        <Dato etiqueta="Nacimiento" valor={formatearFecha(alumno.fechaNacimiento)} />
        <Dato etiqueta="Sexo" valor={alumno.sexo ? ETIQUETA_SEXO[alumno.sexo] : '—'} />
        <Dato etiqueta="Altura" valor={alumno.alturaM ? `${formatearNumero(alumno.alturaM, 2)} m` : '—'} />
        <Dato etiqueta="Objetivo" valor={ETIQUETA_OBJETIVO[alumno.objetivo]} />
        <Dato etiqueta="Control cada" valor={`${alumno.frecuenciaDias} días`} />
        <div className="dato">
          <span className="dato-etiqueta">Próximo control</span>
          <span>{alumno.archivado ? '—' : <EstadoControl estado={estado} />}</span>
        </div>
        {alumno.notas && <Dato etiqueta="Notas" valor={alumno.notas} ancho />}
      </div>

      <h2>Controles</h2>
      {controles.length === 0 ? (
        <p className="tenue">Todavía no tiene controles.</p>
      ) : (
        <div className="tabla-scroll">
        <table className="tabla clicable">
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Peso</th>
              <th>Grasa</th>
              <th>Masa grasa</th>
              <th>Músculo</th>
              <th>Cintura</th>
              <th>Cadera</th>
            </tr>
          </thead>
          <tbody>
            {[...controles].reverse().map((c, i) => (
              <tr key={c.id} onClick={() => navegar(`/alumnos/${id}/controles/${c.id}`)}>
                <td className="tenue">{controles.length - i}</td>
                <td>{formatearFecha(c.fecha)}</td>
                <td>{conUnidad(c.pesoKg, 'kg', 2)}</td>
                <td>{conUnidad(c.grasaPct, '%')}</td>
                <td>{conUnidad(masaGrasaKg(c.pesoKg, c.grasaPct), 'kg', 2)}</td>
                <td>{conUnidad(c.musculoKg, 'kg', 2)}</td>
                <td>{conUnidad(c.cinturaCm, 'cm')}</td>
                <td>{conUnidad(c.caderaCm, 'cm')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </section>
  )
}

function conUnidad(valor: number | null, unidad: string, decimales = 1): string {
  return valor === null ? '—' : `${formatearNumero(valor, decimales)} ${unidad}`
}

function Dato({ etiqueta, valor, ancho }: { etiqueta: string; valor: string; ancho?: boolean }) {
  return (
    <div className={`dato ${ancho ? 'ancho' : ''}`}>
      <span className="dato-etiqueta">{etiqueta}</span>
      <span>{valor}</span>
    </div>
  )
}
