// Cálculos derivados de un Control. Funciones puras: sin DB ni UI.
// Si falta un dato necesario devuelven null (nunca NaN ni 0).

type Valor = number | null | undefined

const positivo = (v: Valor): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0

/** Índice de masa corporal: peso (kg) / altura (m)². */
export function imc(pesoKg: Valor, alturaM: Valor): number | null {
  if (!positivo(pesoKg) || !positivo(alturaM)) return null
  return pesoKg / (alturaM * alturaM)
}

const numero = (v: Valor): v is number => typeof v === 'number' && Number.isFinite(v)

/** Grasa corporal en kg: peso × % grasa / 100. */
export function masaGrasaKg(pesoKg: Valor, grasaPct: Valor): number | null {
  if (!positivo(pesoKg) || !numero(grasaPct)) return null
  return (pesoKg * grasaPct) / 100
}

/** Todo lo que no es grasa, en kg: peso − masa grasa. */
export function masaMagraKg(pesoKg: Valor, grasaPct: Valor): number | null {
  const grasa = masaGrasaKg(pesoKg, grasaPct)
  return grasa === null ? null : (pesoKg as number) - grasa
}

/** Músculo (kg) como porcentaje del peso. */
export function porcentajeMusculo(musculoKg: Valor, pesoKg: Valor): number | null {
  if (!numero(musculoKg) || !positivo(pesoKg)) return null
  return (musculoKg / pesoKg) * 100
}

/** Índice cintura/cadera. */
export function indiceCinturaCadera(cinturaCm: Valor, caderaCm: Valor): number | null {
  if (!positivo(cinturaCm) || !positivo(caderaCm)) return null
  return cinturaCm / caderaCm
}

export type UnidadAltura = 'cm' | 'm'

/** Normaliza la altura cargada (con selector cm/m) a metros. */
export function alturaEnMetros(valor: Valor, unidad: UnidadAltura): number | null {
  if (!positivo(valor)) return null
  return unidad === 'cm' ? valor / 100 : valor
}
