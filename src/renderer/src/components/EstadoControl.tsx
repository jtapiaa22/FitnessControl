import type { EstadoDeControl } from '@shared/controlPendiente'
import { formatearFecha } from '@shared/formato'

export default function EstadoControl({ estado }: { estado: EstadoDeControl }) {
  if (estado.proximaFecha === null) return <span className="etiqueta naranja">Primer control</span>
  if (!estado.pendiente) return <span>{formatearFecha(estado.proximaFecha)}</span>
  if (estado.diasDeAtraso === 0) return <span className="etiqueta naranja">Le toca hoy</span>
  return (
    <span className="etiqueta roja">
      Pendiente hace {estado.diasDeAtraso} {estado.diasDeAtraso === 1 ? 'día' : 'días'}
    </span>
  )
}
