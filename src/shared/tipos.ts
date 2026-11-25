// Modelo de dominio compartido entre main, preload y renderer.
// Los nombres siguen GLOSSARY.md.

export type Objetivo = 'bajar' | 'subir' | 'mantener'
export type Sexo = 'femenino' | 'masculino'

/** Campos que pueden incluirse en un Reporte. */
export const CAMPOS_REPORTE = [
  'peso',
  'imc',
  'grasaPct',
  'masaGrasa',
  'musculo',
  'grasaVisceral',
  'masaOsea',
  'proteinaPct',
  'metabolismoBasal',
  'pecho',
  'cintura',
  'cadera',
  'muslo',
  'brazoRelajado',
  'brazoContraido'
] as const
export type CampoReporte = (typeof CAMPOS_REPORTE)[number]

/** Datos públicos: lo que el Reporte incluye por defecto. */
export const DATOS_PUBLICOS: readonly CampoReporte[] = [
  'peso',
  'grasaPct',
  'masaGrasa',
  'musculo',
  'grasaVisceral',
  'pecho',
  'cintura',
  'cadera',
  'muslo',
  'brazoRelajado',
  'brazoContraido'
]

export interface Alumno {
  id: string
  nombre: string
  telefono: string | null
  /** YYYY-MM-DD */
  fechaNacimiento: string | null
  sexo: Sexo | null
  notas: string | null
  /** Siempre en metros. */
  alturaM: number | null
  objetivo: Objetivo
  frecuenciaDias: number
  archivado: boolean
  /** Última selección de campos usada en un Reporte; null = usar DATOS_PUBLICOS. */
  camposReporte: CampoReporte[] | null
  creadoEn: string
  actualizadoEn: string
}

/** Alumno con datos resumidos de sus Controles, para listas. */
export interface AlumnoConResumen extends Alumno {
  /** Fecha del último Control (YYYY-MM-DD), o null si no tiene. */
  ultimoControl: string | null
  cantidadControles: number
}

export type AlumnoNuevo = Omit<Alumno, 'id' | 'creadoEn' | 'actualizadoEn' | 'archivado' | 'camposReporte'>

/**
 * Un Control. Todos los valores son opcionales salvo la fecha.
 * Medidas de extremidades: siempre se guardan por lado (izquierdo / derecho).
 * Midiendo un solo lado se completa solo ese; `ambosLados` recuerda cómo midió
 * la Instructora, para mostrar el formulario igual en el próximo Control.
 */
export interface Control {
  id: string
  alumnoId: string
  /** YYYY-MM-DD */
  fecha: string
  /** Altura vigente al momento del Control, en metros. */
  alturaM: number | null
  pesoKg: number | null
  grasaPct: number | null
  musculoKg: number | null
  grasaVisceral: number | null
  masaOseaKg: number | null
  proteinaPct: number | null
  metabolismoBasalKcal: number | null
  pechoCm: number | null
  cinturaCm: number | null
  caderaCm: number | null
  ambosLados: boolean
  musloIzqCm: number | null
  musloDerCm: number | null
  brazoRelajadoIzqCm: number | null
  brazoRelajadoDerCm: number | null
  brazoContraidoIzqCm: number | null
  brazoContraidoDerCm: number | null
  notaReporte: string | null
  creadoEn: string
  actualizadoEn: string
}

export type ControlNuevo = Omit<Control, 'id' | 'creadoEn' | 'actualizadoEn'>
