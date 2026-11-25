import type { Alumno, AlumnoConResumen, AlumnoNuevo, Control, ControlNuevo } from './tipos'

/** API que el preload expone al renderer como `window.api`. */
export interface FitnessApi {
  alumnos: {
    listar(opciones?: { incluirArchivados?: boolean }): Promise<AlumnoConResumen[]>
    obtener(id: string): Promise<Alumno | null>
    crear(datos: AlumnoNuevo): Promise<Alumno>
    actualizar(id: string, cambios: Partial<Omit<Alumno, 'id' | 'creadoEn' | 'actualizadoEn'>>): Promise<Alumno>
    eliminar(id: string): Promise<void>
  }
  controles: {
    listarPorAlumno(alumnoId: string): Promise<Control[]>
    crear(datos: ControlNuevo): Promise<Control>
    actualizar(id: string, cambios: Partial<Omit<Control, 'id' | 'alumnoId' | 'creadoEn' | 'actualizadoEn'>>): Promise<Control>
    eliminar(id: string): Promise<void>
  }
}

/** Nombres de canales IPC, compartidos entre main y preload. */
export const CANALES = {
  alumnosListar: 'alumnos:listar',
  alumnosObtener: 'alumnos:obtener',
  alumnosCrear: 'alumnos:crear',
  alumnosActualizar: 'alumnos:actualizar',
  alumnosEliminar: 'alumnos:eliminar',
  controlesListar: 'controles:listarPorAlumno',
  controlesCrear: 'controles:crear',
  controlesActualizar: 'controles:actualizar',
  controlesEliminar: 'controles:eliminar'
} as const
