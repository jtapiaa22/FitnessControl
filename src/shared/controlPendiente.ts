// Cuándo le toca el próximo Control a un Alumno, según su Frecuencia de control.
// Las fechas son días de calendario (YYYY-MM-DD); se calculan en UTC para que
// la zona horaria nunca corra un día.

const MS_POR_DIA = 86_400_000

const aDia = (fecha: string): number => Date.parse(`${fecha}T00:00:00Z`) / MS_POR_DIA
const aFecha = (dia: number): string => new Date(dia * MS_POR_DIA).toISOString().slice(0, 10)

export interface EstadoDeControl {
  pendiente: boolean
  proximaFecha: string | null
  diasDeAtraso: number
}

export function estadoDeControl(datos: {
  ultimoControl: string | null
  frecuenciaDias: number
  hoy: string
}): EstadoDeControl {
  // Sin Controles todavía: le toca el primero.
  if (datos.ultimoControl === null) return { pendiente: true, proximaFecha: null, diasDeAtraso: 0 }
  const proxima = aDia(datos.ultimoControl) + datos.frecuenciaDias
  const hoy = aDia(datos.hoy)
  return { pendiente: hoy >= proxima, proximaFecha: aFecha(proxima), diasDeAtraso: Math.max(0, hoy - proxima) }
}
