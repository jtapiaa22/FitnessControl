// Dónde guarda cada cosa la app. Los datos de desarrollo y los de la app instalada
// nunca se mezclan:
//   - App instalada: %APPDATA%\fitness-control (datos) y Documentos\FitnessControl
//     (copias de seguridad y reportes).
//   - npm run dev: todo dentro del proyecto, en .datos-dev\ (ignorado por git).
import { join } from 'node:path'
import { app } from 'electron'

export const esDesarrollo = (): boolean => !app.isPackaged

/** Carpeta de datos (la base y lo que guarda Chromium). FITNESS_DATOS la cambia en pruebas automáticas. */
export function carpetaDeDatos(): string {
  if (process.env.FITNESS_DATOS) return process.env.FITNESS_DATOS
  return esDesarrollo() ? join(app.getAppPath(), '.datos-dev') : join(app.getPath('appData'), 'fitness-control')
}

/** Carpeta por defecto de las copias de seguridad. */
export function carpetaDeCopiasPorDefecto(): string {
  return esDesarrollo() ? join(app.getPath('userData'), 'copias') : join(app.getPath('documents'), 'FitnessControl', 'Copias')
}

/** Carpeta sugerida para los Reportes de un Alumno. */
export function carpetaDeReportesPorDefecto(nombreAlumno: string): string {
  const base = esDesarrollo() ? join(app.getPath('userData'), 'reportes') : join(app.getPath('documents'), 'FitnessControl', 'Reportes')
  return join(base, nombreAlumno.replace(/[\\/:*?"<>|]/g, '-').trim())
}
