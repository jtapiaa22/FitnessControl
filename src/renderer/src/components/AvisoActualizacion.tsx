import { useState } from 'react'
import { mensajeDeError } from '../errores'
import { useActualizacion } from '../useActualizacion'

/** Aviso arriba de todo cuando hay una versión nueva descargada. Nunca reinicia solo. */
export default function AvisoActualizacion() {
  const estado = useActualizacion()
  const [error, setError] = useState<string | null>(null)
  if (estado.tipo !== 'descargada') return null

  return (
    <div className="aviso-actualizacion" role="status">
      <span>
        <strong>Hay una versión nueva ({estado.version}).</strong> Se instala sola la próxima vez que cierres la app.
      </span>
      <button
        className="chico"
        onClick={() => window.api.actualizaciones.instalarAhora().catch((e) => setError(mensajeDeError(e)))}
      >
        Reiniciar y actualizar
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  )
}
