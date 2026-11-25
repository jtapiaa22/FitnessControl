import { describe, expect, it } from 'vitest'
import { estadoDeControl } from './controlPendiente'

describe('estadoDeControl', () => {
  it('el Control queda pendiente el día que se cumple la Frecuencia de control', () => {
    const estado = estadoDeControl({ ultimoControl: '2026-11-18', frecuenciaDias: 7, hoy: '2026-11-25' })
    expect(estado).toEqual({ pendiente: true, proximaFecha: '2026-11-25', diasDeAtraso: 0 })
  })

  it('no está pendiente antes de esa fecha', () => {
    const estado = estadoDeControl({ ultimoControl: '2026-11-18', frecuenciaDias: 7, hoy: '2026-11-24' })
    expect(estado).toEqual({ pendiente: false, proximaFecha: '2026-11-25', diasDeAtraso: 0 })
  })

  it('cuenta los días de atraso', () => {
    const estado = estadoDeControl({ ultimoControl: '2026-11-18', frecuenciaDias: 7, hoy: '2026-11-28' })
    expect(estado.diasDeAtraso).toBe(3)
  })

  it('respeta frecuencias distintas y el cambio de mes y de año', () => {
    expect(estadoDeControl({ ultimoControl: '2026-11-28', frecuenciaDias: 14, hoy: '2026-12-01' }).proximaFecha).toBe('2026-12-12')
    expect(estadoDeControl({ ultimoControl: '2026-12-26', frecuenciaDias: 10, hoy: '2027-01-01' }).proximaFecha).toBe('2027-01-05')
  })

  it('un Alumno sin Controles está pendiente de su primer Control', () => {
    const estado = estadoDeControl({ ultimoControl: null, frecuenciaDias: 7, hoy: '2026-11-25' })
    expect(estado).toEqual({ pendiente: true, proximaFecha: null, diasDeAtraso: 0 })
  })
})
