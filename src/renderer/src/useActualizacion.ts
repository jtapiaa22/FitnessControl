import { useEffect, useState } from 'react'
import type { EstadoActualizacion } from '@shared/api'

/** Estado de las actualizaciones automáticas, siempre al día. */
export function useActualizacion(): EstadoActualizacion {
  const [estado, setEstado] = useState<EstadoActualizacion>({ tipo: 'inactivo' })
  useEffect(() => {
    void window.api.actualizaciones.estado().then(setEstado)
    return window.api.actualizaciones.alCambiar(setEstado)
  }, [])
  return estado
}
