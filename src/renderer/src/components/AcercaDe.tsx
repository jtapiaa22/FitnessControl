import { useState } from 'react'
import type { EstadoActualizacion } from '@shared/api'
import icono from '../assets/icono.png'
import { mensajeDeError } from '../errores'
import { NOVEDADES } from '../novedades'
import { useActualizacion } from '../useActualizacion'

function textoDeEstado(estado: EstadoActualizacion): string | null {
  switch (estado.tipo) {
    case 'buscando':
      return 'Buscando actualizaciones…'
    case 'al-dia':
      return 'Tenés la última versión.'
    case 'disponible':
      return `Hay una versión nueva (${estado.version}). Descargando…`
    case 'descargando':
      return `Descargando la versión nueva… ${estado.porcentaje}%`
    case 'descargada':
      return `La versión ${estado.version} está lista. Se instala al cerrar la app.`
    case 'error':
      return `No se pudo buscar actualizaciones: ${estado.mensaje}`
    default:
      return null
  }
}

/** Créditos de la app y actualizaciones, en Configuración. */
export default function AcercaDe() {
  const estado = useActualizacion()
  const [error, setError] = useState<string | null>(null)
  const texto = error ?? textoDeEstado(estado)

  const buscar = () => {
    setError(null)
    window.api.actualizaciones.buscar().catch((e) => setError(mensajeDeError(e)))
  }

  return (
    <fieldset>
      <legend>Acerca de</legend>
      <div className="acerca">
        <img src={icono} alt="" className="acerca-icono" />
        <div>
          <div className="acerca-nombre">FitnessControl</div>
          <div className="tenue">Versión {__VERSION__}</div>
          <div className="acerca-autor">
            Desarrollado por <strong>TADevStudio</strong>
          </div>
          <div className="tenue">© {new Date().getFullYear()} TADevStudio. Todos los derechos reservados.</div>
        </div>
      </div>
      <div className="acciones" style={{ marginTop: '1.25rem' }}>
        {estado.tipo === 'descargada' ? (
          <button type="button" onClick={() => window.api.actualizaciones.instalarAhora().catch((e) => setError(mensajeDeError(e)))}>
            Reiniciar y actualizar
          </button>
        ) : (
          <button type="button" className="secundario" onClick={buscar} disabled={estado.tipo === 'buscando' || estado.tipo === 'descargando'}>
            Buscar actualizaciones
          </button>
        )}
        {texto && <span className={error || estado.tipo === 'error' ? 'error' : 'tenue'}>{texto}</span>}
      </div>
      <p className="tenue" style={{ marginBottom: 0 }}>
        La app busca versiones nuevas sola al abrirse y las descarga en segundo plano. Nunca se reinicia sin avisar.
      </p>
      {NOVEDADES[0] && (
        <div className="novedades">
          <div className="novedades-titulo">Novedades de esta versión ({NOVEDADES[0].version})</div>
          <ul>
            {NOVEDADES[0].cambios.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </fieldset>
  )
}
