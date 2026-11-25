// Comparación entre dos Controles del mismo Alumno. Ver GLOSSARY.md.
// Solo dice si un valor subió o bajó: si eso es bueno o malo lo interpreta la Instructora.
import { imc, masaGrasaKg } from './calculos'
import type { CampoReporte, Control } from './tipos'

export type Cambio = 'sube' | 'baja' | 'igual'

export interface FilaComparacion {
  campo: CampoReporte
  /** Solo en Medidas de extremidades. */
  lado?: 'izq' | 'der'
  base: number | null
  actual: number | null
  diferencia: number | null
  /** null cuando falta un dato en alguno de los dos Controles. */
  cambio: Cambio | null
}

type Extractor = (c: Control) => number | null

const CAMPOS: [CampoReporte, Extractor][] = [
  ['peso', (c) => c.pesoKg],
  ['imc', (c) => imc(c.pesoKg, c.alturaM)],
  ['grasaPct', (c) => c.grasaPct],
  ['masaGrasa', (c) => masaGrasaKg(c.pesoKg, c.grasaPct)],
  ['musculo', (c) => c.musculoKg],
  ['grasaVisceral', (c) => c.grasaVisceral],
  ['masaOsea', (c) => c.masaOseaKg],
  ['proteinaPct', (c) => c.proteinaPct],
  ['metabolismoBasal', (c) => c.metabolismoBasalKcal],
  ['pecho', (c) => c.pechoCm],
  ['cintura', (c) => c.cinturaCm],
  ['cadera', (c) => c.caderaCm]
]

const EXTREMIDADES: [CampoReporte, { izq: Extractor; der: Extractor }][] = [
  ['muslo', { izq: (c) => c.musloIzqCm, der: (c) => c.musloDerCm }],
  ['brazoRelajado', { izq: (c) => c.brazoRelajadoIzqCm, der: (c) => c.brazoRelajadoDerCm }],
  ['brazoContraido', { izq: (c) => c.brazoContraidoIzqCm, der: (c) => c.brazoContraidoDerCm }]
]

/** Diferencias menores a lo que se ve con 2 decimales cuentan como "igual". */
function cambioDe(diferencia: number): Cambio {
  const redondeada = Math.round(diferencia * 100) / 100
  return redondeada > 0 ? 'sube' : redondeada < 0 ? 'baja' : 'igual'
}

function comparar(campo: CampoReporte, base: number | null, actual: number | null, lado?: 'izq' | 'der'): FilaComparacion {
  const diferencia = base !== null && actual !== null ? actual - base : null
  return {
    campo,
    ...(lado ? { lado } : {}),
    base,
    actual,
    diferencia,
    cambio: diferencia === null ? null : cambioDe(diferencia)
  }
}

/**
 * Compara dos Controles campo por campo. Las extremidades se comparan siempre
 * lado contra lado y nunca se cruzan:
 * - Se comparan los lados medidos en los dos Controles (un lado contra ambos →
 *   solo ese lado; ambos contra ambos → los dos).
 * - Si no hay ningún lado en común, se muestran los lados medidos sin diferencia.
 * - Si no se midió ningún lado, queda una sola fila vacía.
 */
export function compararControles(base: Control, actual: Control): FilaComparacion[] {
  const filas = CAMPOS.map(([campo, valor]) => comparar(campo, valor(base), valor(actual)))
  for (const [campo, lados] of EXTREMIDADES) {
    const todos = ['izq', 'der'] as const
    const enComun = todos.filter((l) => lados[l](base) !== null && lados[l](actual) !== null)
    const enAlguno = todos.filter((l) => lados[l](base) !== null || lados[l](actual) !== null)
    const aMostrar = enComun.length > 0 ? enComun : enAlguno
    if (aMostrar.length === 0) filas.push(comparar(campo, null, null))
    for (const l of aMostrar) filas.push(comparar(campo, lados[l](base), lados[l](actual), l))
  }
  return filas
}
