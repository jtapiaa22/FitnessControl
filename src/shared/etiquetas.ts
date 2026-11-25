import type { CampoReporte, Objetivo, Sexo } from './tipos'

export const ETIQUETA_CAMPO: Record<CampoReporte, { nombre: string; unidad: string; decimales: number }> = {
  peso: { nombre: 'Peso', unidad: 'kg', decimales: 2 },
  imc: { nombre: 'IMC', unidad: '', decimales: 1 },
  grasaPct: { nombre: 'Grasa corporal', unidad: '%', decimales: 1 },
  masaGrasa: { nombre: 'Masa grasa', unidad: 'kg', decimales: 2 },
  musculo: { nombre: 'Músculo', unidad: 'kg', decimales: 2 },
  grasaVisceral: { nombre: 'Grasa visceral', unidad: '', decimales: 1 },
  masaOsea: { nombre: 'Masa ósea', unidad: 'kg', decimales: 2 },
  proteinaPct: { nombre: 'Proteína', unidad: '%', decimales: 1 },
  metabolismoBasal: { nombre: 'Metabolismo basal', unidad: 'kcal', decimales: 0 },
  pecho: { nombre: 'Pecho', unidad: 'cm', decimales: 1 },
  cintura: { nombre: 'Cintura', unidad: 'cm', decimales: 1 },
  cadera: { nombre: 'Cadera', unidad: 'cm', decimales: 1 },
  muslo: { nombre: 'Muslo', unidad: 'cm', decimales: 1 },
  brazoRelajado: { nombre: 'Brazo relajado', unidad: 'cm', decimales: 1 },
  brazoContraido: { nombre: 'Brazo contraído', unidad: 'cm', decimales: 1 }
}

export const ETIQUETA_OBJETIVO: Record<Objetivo, string> = {
  bajar: 'Bajar',
  subir: 'Subir',
  mantener: 'Mantener'
}

export const ETIQUETA_SEXO: Record<Sexo, string> = {
  femenino: 'Femenino',
  masculino: 'Masculino'
}
