import type { Alumno, AlumnoConResumen, AlumnoNuevo, Configuracion, Control, ControlNuevo } from './tipos'

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
  configuracion: {
    obtener(): Promise<Configuracion>
    guardar(cambios: Partial<Configuracion>): Promise<Configuracion>
  }
  reporte: {
    /** Imprime la pantalla actual (con estilos @media print) a PDF y pide dónde guardarlo. null si cancela. */
    guardarPdf(nombreSugerido: string): Promise<string | null>
    abrir(ruta: string): Promise<void>
    mostrarEnCarpeta(ruta: string): Promise<void>
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
  controlesEliminar: 'controles:eliminar',
  configuracionObtener: 'configuracion:obtener',
  configuracionGuardar: 'configuracion:guardar',
  reporteGuardarPdf: 'reporte:guardarPdf',
  reporteAbrir: 'reporte:abrir',
  reporteMostrar: 'reporte:mostrarEnCarpeta'
} as const
