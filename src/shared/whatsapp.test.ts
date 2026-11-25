import { describe, expect, it } from 'vitest'
import { telefonoParaWhatsApp } from './whatsapp'

// Formato internacional de WhatsApp para celulares de Argentina: 54 9 + característica + número,
// sin el 0 de la característica ni el 15.
describe('telefonoParaWhatsApp', () => {
  it('agrega 54 9 a un celular escrito como característica + número', () => {
    expect(telefonoParaWhatsApp('381 555-1201')).toBe('5493815551201')
  })

  it('saca el 0 de la característica y el 15 del celular', () => {
    expect(telefonoParaWhatsApp('0381 15 555-1201')).toBe('5493815551201')
    expect(telefonoParaWhatsApp('(011) 15-4444-5555')).toBe('5491144445555')
    expect(telefonoParaWhatsApp('03543 15 41-2233')).toBe('5493543412233')
  })

  it('respeta un número que ya viene en formato internacional', () => {
    expect(telefonoParaWhatsApp('+54 9 381 555-1201')).toBe('5493815551201')
    expect(telefonoParaWhatsApp('+54 381 555-1201')).toBe('5493815551201')
  })

  it('es null si no hay teléfono o es demasiado corto', () => {
    expect(telefonoParaWhatsApp(null)).toBeNull()
    expect(telefonoParaWhatsApp('')).toBeNull()
    expect(telefonoParaWhatsApp('555-12')).toBeNull()
  })
})
