/** Mensaje legible de un error que viene del proceso principal (sin el prefijo técnico de Electron). */
export function mensajeDeError(e: unknown): string {
  return (e as Error).message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
}
