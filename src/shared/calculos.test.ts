import { describe, expect, it } from 'vitest'
import { alturaEnMetros, indiceCinturaCadera, imc, masaGrasaKg, masaMagraKg, porcentajeMusculo } from './calculos'

// Valores de referencia: captura de la balanza de la Instructora (25/11/2026):
// peso 55,25 kg, IMC 21,1 → altura cargada ≈ 1,62 m.
describe('imc', () => {
  it('coincide con el IMC que muestra la balanza', () => {
    expect(imc(55.25, 1.62)).toBeCloseTo(21.1, 1)
  })

  it('aplica peso / altura² (ejemplo de tabla: 70 kg y 1,75 m → 22,86)', () => {
    expect(imc(70, 1.75)).toBeCloseTo(22.86, 2)
  })

  it('es null si falta el peso o la altura, o la altura no es válida', () => {
    expect(imc(null, 1.62)).toBeNull()
    expect(imc(55.25, null)).toBeNull()
    expect(imc(55.25, 0)).toBeNull()
  })
})

describe('masaGrasaKg', () => {
  it('pasa el % de grasa de la balanza a kg', () => {
    // 55,25 kg con 28,8 % de grasa → 15,912 kg de grasa
    expect(masaGrasaKg(55.25, 28.8)).toBeCloseTo(15.912, 3)
  })

  it('es null si falta el peso o el % de grasa', () => {
    expect(masaGrasaKg(null, 28.8)).toBeNull()
    expect(masaGrasaKg(55.25, null)).toBeNull()
  })
})

describe('masaMagraKg', () => {
  it('es el peso menos la masa grasa', () => {
    // 55,25 − 15,912 = 39,338 kg
    expect(masaMagraKg(55.25, 28.8)).toBeCloseTo(39.338, 3)
  })

  it('es null si falta un dato', () => {
    expect(masaMagraKg(55.25, null)).toBeNull()
  })
})

describe('porcentajeMusculo', () => {
  it('expresa el músculo de la balanza como % del peso, para compararlo con el % de grasa', () => {
    // 37,19 kg de músculo sobre 55,25 kg ≈ 67,31 %
    expect(porcentajeMusculo(37.19, 55.25)).toBeCloseTo(67.31, 2)
  })

  it('es null si falta un dato', () => {
    expect(porcentajeMusculo(null, 55.25)).toBeNull()
    expect(porcentajeMusculo(37.19, null)).toBeNull()
  })
})

describe('indiceCinturaCadera', () => {
  it('divide cintura por cadera', () => {
    // 70 cm / 95 cm ≈ 0,737
    expect(indiceCinturaCadera(70, 95)).toBeCloseTo(0.737, 3)
  })

  it('es null si falta una de las dos medidas', () => {
    expect(indiceCinturaCadera(70, null)).toBeNull()
    expect(indiceCinturaCadera(null, 95)).toBeNull()
  })
})

describe('alturaEnMetros', () => {
  it('convierte de cm a m según la unidad elegida', () => {
    expect(alturaEnMetros(165, 'cm')).toBeCloseTo(1.65, 5)
    expect(alturaEnMetros(1.65, 'm')).toBeCloseTo(1.65, 5)
  })

  it('es null si no hay valor', () => {
    expect(alturaEnMetros(null, 'cm')).toBeNull()
  })
})
