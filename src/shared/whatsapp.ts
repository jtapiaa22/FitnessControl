// Envío de Reportes por WhatsApp.

/**
 * Convierte un teléfono escrito a mano al formato internacional que usa WhatsApp
 * (solo dígitos). Pensado para celulares de Argentina: 54 9 + característica +
 * número, sin el 0 de la característica ni el 15. Un número de otro país escrito
 * con "+" se respeta tal cual. Devuelve null si no hay un número reconocible.
 */
export function telefonoParaWhatsApp(texto: string | null | undefined): string | null {
  const limpio = (texto ?? '').trim()
  let digitos = limpio.replace(/\D/g, '')
  const internacional = limpio.startsWith('+') || digitos.startsWith('00')
  if (digitos.startsWith('00')) digitos = digitos.slice(2)

  if (internacional && !digitos.startsWith('54')) return digitos.length >= 8 ? digitos : null

  // Pasar a número nacional: característica (2 a 4 dígitos) + número = 10 dígitos.
  if (digitos.startsWith('54')) digitos = digitos.slice(2)
  if (digitos.startsWith('9') && digitos.length === 11) digitos = digitos.slice(1)
  if (digitos.startsWith('0')) digitos = digitos.slice(1)
  if (digitos.length === 12) digitos = sinQuince(digitos)

  return digitos.length === 10 ? `549${digitos}` : null
}

/** Quita el "15" que va después de la característica (de 2, 3 o 4 dígitos). */
function sinQuince(d: string): string {
  const posiciones = d.startsWith('11') ? [2] : [3, 4, 2]
  for (const p of posiciones) {
    if (d.slice(p, p + 2) === '15') return d.slice(0, p) + d.slice(p + 2)
  }
  return d
}

/** Mensaje que acompaña al Reporte en WhatsApp. */
export function mensajeDeReporte(nombreAlumno: string, desde: string, hasta: string): string {
  const nombre = nombreAlumno.trim().split(/\s+/)[0] ?? ''
  return `¡Hola ${nombre}! Te paso tu reporte de progreso (${desde} → ${hasta}). 💪`
}
