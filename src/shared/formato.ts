// Fechas y números en formato argentino.

/** Fecha de hoy en la zona horaria local, como YYYY-MM-DD (nunca vía toISOString, que usa UTC). */
export function hoyLocal(ahora: Date = new Date()): string {
  const y = ahora.getFullYear()
  const m = String(ahora.getMonth() + 1).padStart(2, '0')
  const d = String(ahora.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 2026-11-25 → 25/11/2026 */
export function formatearFecha(fecha: string | null): string {
  if (!fecha) return '—'
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

/** Número con coma decimal. null → "—". */
export function formatearNumero(valor: number | null | undefined, decimales = 1): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—'
  return valor.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: decimales })
}

/** Lee lo que escribió la Instructora: acepta coma o punto decimal. Vacío → null; texto inválido → NaN. */
export function parsearNumero(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.')
  if (limpio === '') return null
  return /^-?\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : Number.NaN
}
