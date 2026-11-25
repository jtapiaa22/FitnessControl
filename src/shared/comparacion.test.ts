import { describe, expect, it } from 'vitest'
import { compararControles, type FilaComparacion } from './comparacion'
import { CAMPOS_REPORTE, type Control } from './tipos'

function control(valores: Partial<Control>): Control {
  return {
    id: 'x', alumnoId: 'a', fecha: '2026-11-01', alturaM: 1.62,
    pesoKg: null, grasaPct: null, musculoKg: null, grasaVisceral: null, masaOseaKg: null,
    proteinaPct: null, metabolismoBasalKcal: null, pechoCm: null, cinturaCm: null, caderaCm: null,
    ambosLados: false, musloIzqCm: null, musloDerCm: null, brazoRelajadoIzqCm: null, brazoRelajadoDerCm: null,
    brazoContraidoIzqCm: null, brazoContraidoDerCm: null, notaReporte: null, creadoEn: '', actualizadoEn: '',
    ...valores
  }
}

const fila = (filas: FilaComparacion[], campo: string, lado?: 'izq' | 'der') =>
  filas.find((f) => f.campo === campo && f.lado === lado)!

describe('compararControles', () => {
  it('calcula la diferencia del peso entre el Control base y el actual', () => {
    const peso = fila(compararControles(control({ pesoKg: 58 }), control({ pesoKg: 55.25 })), 'peso')
    expect(peso.base).toBe(58)
    expect(peso.actual).toBe(55.25)
    expect(peso.diferencia).toBeCloseTo(-2.75, 5)
  })

  it('marca si cada valor subió, bajó o quedó igual, sin juzgar si es bueno o malo', () => {
    const filas = compararControles(
      control({ pesoKg: 58, grasaPct: 30, musculoKg: 36 }),
      control({ pesoKg: 55.25, grasaPct: 30, musculoKg: 37 })
    )
    expect(fila(filas, 'peso').cambio).toBe('baja')
    expect(fila(filas, 'grasaPct').cambio).toBe('igual')
    expect(fila(filas, 'musculo').cambio).toBe('sube')
  })

  it('una diferencia que se pierde al redondear a 2 decimales cuenta como igual', () => {
    const filas = compararControles(control({ pesoKg: 55.25 }), control({ pesoKg: 55.25000001 }))
    expect(fila(filas, 'peso').cambio).toBe('igual')
  })

  it('compara la masa grasa en kg aunque la balanza dé el %', () => {
    // base: 58 kg × 30 % = 17,4 kg · actual: 55,25 kg × 28,8 % = 15,912 kg
    const masaGrasa = fila(
      compararControles(control({ pesoKg: 58, grasaPct: 30 }), control({ pesoKg: 55.25, grasaPct: 28.8 })),
      'masaGrasa'
    )
    expect(masaGrasa.base).toBeCloseTo(17.4, 3)
    expect(masaGrasa.actual).toBeCloseTo(15.912, 3)
    expect(masaGrasa.diferencia).toBeCloseTo(-1.488, 3)
    expect(masaGrasa.cambio).toBe('baja')
  })

  it('con Ambos lados compara izquierdo con izquierdo y derecho con derecho', () => {
    const filas = compararControles(
      control({ ambosLados: true, musloIzqCm: 52, musloDerCm: 53 }),
      control({ ambosLados: true, musloIzqCm: 51, musloDerCm: 53.5 })
    )
    expect(fila(filas, 'muslo', 'izq').diferencia).toBeCloseTo(-1, 5)
    expect(fila(filas, 'muslo', 'der').diferencia).toBeCloseTo(0.5, 5)
  })

  it('midiendo un solo lado, compara ese mismo lado', () => {
    const filas = compararControles(control({ brazoRelajadoDerCm: 28 }), control({ brazoRelajadoDerCm: 27 }))
    expect(fila(filas, 'brazoRelajado', 'der').diferencia).toBeCloseTo(-1, 5)
    expect(filas.filter((f) => f.campo === 'brazoRelajado')).toHaveLength(1)
  })

  it('un lado contra ambos lados compara solo el lado que está en los dos Controles', () => {
    // Control 1: solo izquierdo · Control 2: ambos lados
    const control1 = control({ musloIzqCm: 52 })
    const control2 = control({ ambosLados: true, musloIzqCm: 51, musloDerCm: 53 })
    const filas = compararControles(control1, control2).filter((f) => f.campo === 'muslo')
    expect(filas).toHaveLength(1)
    expect(filas[0]).toMatchObject({ lado: 'izq', base: 52, actual: 51 })
    expect(filas[0]!.diferencia).toBeCloseTo(-1, 5)
  })

  it('ambos lados contra ambos lados compara los dos lados', () => {
    // Control 2 y Control 3 midieron ambos lados
    const control2 = control({ ambosLados: true, musloIzqCm: 51, musloDerCm: 53 })
    const control3 = control({ ambosLados: true, musloIzqCm: 50, musloDerCm: 52.5 })
    const filas = compararControles(control2, control3).filter((f) => f.campo === 'muslo')
    expect(filas.map((f) => f.lado)).toEqual(['izq', 'der'])
    expect(fila(filas, 'muslo', 'der').diferencia).toBeCloseTo(-0.5, 5)
  })

  it('nunca cruza lados: un Control con solo el izquierdo y otro con solo el derecho no tienen diferencia', () => {
    const filas = compararControles(control({ musloIzqCm: 52 }), control({ musloDerCm: 51 }))
    expect(fila(filas, 'muslo', 'izq')).toMatchObject({ base: 52, actual: null, diferencia: null })
    expect(fila(filas, 'muslo', 'der')).toMatchObject({ base: null, actual: 51, diferencia: null })
  })

  it('si falta un dato en algún Control no hay diferencia ni cambio', () => {
    const peso = fila(compararControles(control({ pesoKg: 58 }), control({ pesoKg: null })), 'peso')
    expect(peso.diferencia).toBeNull()
    expect(peso.cambio).toBeNull()
  })

  it('incluye al menos una fila por cada campo que puede ir en el Reporte', () => {
    const campos = new Set(compararControles(control({}), control({})).map((f) => f.campo))
    expect([...campos].sort()).toEqual([...CAMPOS_REPORTE].sort())
  })
})
