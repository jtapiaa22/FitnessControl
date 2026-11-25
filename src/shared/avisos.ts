// Avisos amarillos al cargar un Control: no bloquean, solo señalan posibles errores
// de tipeo (p. ej. 288 en vez de 28,8). Ver docs/requisitos-iniciales.md.
import type { Control } from './tipos'

export type CampoNumerico = {
  [K in keyof Control]: Control[K] extends number | null ? K : never
}[keyof Control]

export interface Aviso {
  campo: CampoNumerico
  mensaje: string
}

interface Regla {
  min: number
  max: number
  /** Cambio máximo esperable contra el Control anterior. */
  salto?: number
  unidad: string
}

// Rangos amplios a propósito: solo atrapan valores imposibles o mal tipeados.
const REGLAS: Partial<Record<CampoNumerico, Regla>> = {
  alturaM: { min: 1.0, max: 2.3, unidad: 'm' },
  pesoKg: { min: 25, max: 250, salto: 5, unidad: 'kg' },
  grasaPct: { min: 3, max: 70, salto: 5, unidad: '%' },
  musculoKg: { min: 10, max: 120, salto: 4, unidad: 'kg' },
  grasaVisceral: { min: 1, max: 30, salto: 3, unidad: '' },
  masaOseaKg: { min: 0.5, max: 6, salto: 1, unidad: 'kg' },
  proteinaPct: { min: 5, max: 30, salto: 5, unidad: '%' },
  metabolismoBasalKcal: { min: 600, max: 4000, salto: 300, unidad: 'kcal' },
  pechoCm: { min: 50, max: 200, salto: 6, unidad: 'cm' },
  cinturaCm: { min: 40, max: 200, salto: 6, unidad: 'cm' },
  caderaCm: { min: 50, max: 200, salto: 6, unidad: 'cm' },
  musloIzqCm: { min: 25, max: 100, salto: 5, unidad: 'cm' },
  musloDerCm: { min: 25, max: 100, salto: 5, unidad: 'cm' },
  brazoRelajadoIzqCm: { min: 15, max: 70, salto: 3, unidad: 'cm' },
  brazoRelajadoDerCm: { min: 15, max: 70, salto: 3, unidad: 'cm' },
  brazoContraidoIzqCm: { min: 15, max: 75, salto: 3, unidad: 'cm' },
  brazoContraidoDerCm: { min: 15, max: 75, salto: 3, unidad: 'cm' }
}

const fmt = (n: number): string => n.toLocaleString('es-AR', { maximumFractionDigits: 2 })

export function avisosDeControl(control: Partial<Control>, anterior: Control | null): Aviso[] {
  const avisos: Aviso[] = []
  for (const [campo, regla] of Object.entries(REGLAS) as [CampoNumerico, Regla][]) {
    const valor = control[campo]
    if (typeof valor !== 'number') continue
    if (Number.isNaN(valor)) {
      avisos.push({ campo, mensaje: 'No es un número válido' })
      continue
    }
    if (valor < regla.min || valor > regla.max) {
      avisos.push({ campo, mensaje: `Valor poco habitual (esperado entre ${fmt(regla.min)} y ${fmt(regla.max)} ${regla.unidad})` })
      continue
    }
    const previo = anterior?.[campo]
    if (regla.salto !== undefined && typeof previo === 'number' && Math.abs(valor - previo) > regla.salto) {
      avisos.push({ campo, mensaje: `Cambió ${fmt(valor - previo)} ${regla.unidad} desde el Control anterior (${fmt(previo)})` })
    }
  }
  if (typeof control.musculoKg === 'number' && typeof control.pesoKg === 'number' && control.musculoKg >= control.pesoKg) {
    avisos.push({ campo: 'musculoKg', mensaje: 'El músculo no puede ser mayor o igual al peso' })
  }
  return avisos
}
