import type { Alumno, AlumnoConResumen, AlumnoNuevo, CampoReporte, Configuracion, Control, ControlNuevo, ReporteGuardado } from './tipos'

/** Estado de las actualizaciones automáticas (ver src/main/actualizaciones.ts). */
export type EstadoActualizacion =
  | { tipo: 'inactivo' }
  | { tipo: 'buscando' }
  | { tipo: 'al-dia'; version: string }
  | { tipo: 'disponible'; version: string }
  | { tipo: 'descargando'; porcentaje: number }
  | { tipo: 'descargada'; version: string }
  | { tipo: 'error'; mensaje: string }

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
  backup: {
    /** Carpeta donde se guardan las copias (la elegida o la de por defecto). */
    carpeta(): Promise<string>
    /** Abre el diálogo para elegir carpeta y la guarda. null si cancela. */
    elegirCarpeta(): Promise<string | null>
    /** Hace la copia ahora y devuelve la ruta del archivo. */
    hacerCopia(): Promise<string>
    abrirCarpeta(): Promise<void>
    /** Abre el diálogo para elegir una copia y la revisa. null si cancela. */
    elegirCopia(): Promise<{ ruta: string; alumnos: number; controles: number } | null>
    /** Reemplaza los datos actuales por la copia y reinicia la app. */
    restaurar(ruta: string): Promise<void>
  }
  actualizaciones: {
    estado(): Promise<EstadoActualizacion>
    /** Busca una versión nueva ahora (solo en la app instalada). */
    buscar(): Promise<void>
    /** Cierra la app e instala la versión descargada. */
    instalarAhora(): Promise<void>
    /** Avisa cada cambio de estado. Devuelve la función para dejar de escuchar. */
    alCambiar(fn: (estado: EstadoActualizacion) => void): () => void
  }
  reporte: {
    /**
     * Imprime la pantalla actual (estilos @media print) a PDF y lo guarda en el historial.
     * La primera vez para un par de Controles pregunta dónde guardarlo; si ya existía,
     * reemplaza el mismo archivo sin preguntar. null si se cancela.
     */
    guardarPdf(datos: {
      alumnoId: string
      controlBaseId: string
      controlActualId: string
      campos: CampoReporte[]
      nota: string | null
      nombreSugerido: string
    }): Promise<{ reporte: ReporteGuardado; reemplazado: boolean } | null>
    historial(alumnoId: string): Promise<ReporteGuardado[]>
    abrir(id: string): Promise<void>
    mostrarEnCarpeta(id: string): Promise<void>
    /** Copia el PDF al portapapeles y abre WhatsApp en el chat del Alumno. */
    enviarPorWhatsApp(id: string): Promise<{ conTelefono: boolean; destino: 'escritorio' | 'web' }>
    /** Quita el Reporte del historial; el PDF queda en la compu. */
    quitar(id: string): Promise<void>
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
  backupCarpeta: 'backup:carpeta',
  backupElegirCarpeta: 'backup:elegirCarpeta',
  backupHacerCopia: 'backup:hacerCopia',
  backupAbrirCarpeta: 'backup:abrirCarpeta',
  backupElegirCopia: 'backup:elegirCopia',
  backupRestaurar: 'backup:restaurar',
  actualizacionEstado: 'actualizacion:estado',
  actualizacionEstadoActual: 'actualizacion:estadoActual',
  actualizacionBuscar: 'actualizacion:buscar',
  actualizacionInstalar: 'actualizacion:instalar',
  reporteGuardarPdf: 'reporte:guardarPdf',
  reporteHistorial: 'reporte:historial',
  reporteAbrir: 'reporte:abrir',
  reporteMostrar: 'reporte:mostrarEnCarpeta',
  reporteWhatsApp: 'reporte:enviarPorWhatsApp',
  reporteQuitar: 'reporte:quitar'
} as const
