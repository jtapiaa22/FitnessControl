// Reportes en PDF: generación, historial y envío por WhatsApp.
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { CANALES } from '@shared/api'
import { formatearFecha } from '@shared/formato'
import type { CampoReporte } from '@shared/tipos'
import { mensajeDeReporte, telefonoParaWhatsApp } from '@shared/whatsapp'
import { carpetaDeReportesPorDefecto } from './carpetas'
import type { Repositorio } from './db/repositorio'

const sinCaracteresInvalidos = (texto: string): string => texto.replace(/[\\/:*?"<>|]/g, '-').trim()


/** Pone el archivo en el portapapeles de Windows, listo para pegar (Ctrl+V) en WhatsApp. */
function copiarArchivoAlPortapapeles(ruta: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // La ruta va por variable de entorno, nunca dentro del comando.
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', 'Set-Clipboard -LiteralPath $env:FITNESS_ARCHIVO'],
      { env: { ...process.env, FITNESS_ARCHIVO: ruta }, windowsHide: true },
      (error) => (error ? reject(error) : resolve())
    )
  })
}

export function registrarReportes(repo: Repositorio): void {
  const reporteExistente = (id: string) => {
    const reporte = repo.reportes.obtener(id)
    if (!reporte) throw new Error('Ese reporte ya no está en el historial.')
    if (!existsSync(reporte.ruta)) throw new Error(`El archivo del reporte no está más en ${reporte.ruta}. Volvé a generarlo.`)
    return reporte
  }

  ipcMain.handle(
    CANALES.reporteGuardarPdf,
    async (
      e,
      datos: { alumnoId: string; controlBaseId: string; controlActualId: string; campos: CampoReporte[]; nota: string | null; nombreSugerido: string }
    ) => {
      const alumno = repo.alumnos.obtener(datos.alumnoId)
      if (!alumno) throw new Error('No existe el alumno.')
      const anterior = repo.reportes.buscarPar(datos.alumnoId, datos.controlBaseId, datos.controlActualId)

      let ruta: string
      if (anterior) {
        // Mismo par de Controles: se reemplaza el mismo archivo, sin preguntar.
        ruta = anterior.ruta
      } else {
        const nombre = `${sinCaracteresInvalidos(datos.nombreSugerido)}.pdf`
        const carpeta = carpetaDeReportesPorDefecto(alumno.nombre)
        // FITNESS_PDF_DESTINO: solo para pruebas automáticas, evita el diálogo de guardar.
        const destinoDePrueba = process.env.FITNESS_PDF_DESTINO
        if (destinoDePrueba) {
          ruta = join(destinoDePrueba, nombre)
        } else {
          await mkdir(carpeta, { recursive: true })
          const opciones = { title: 'Guardar reporte', defaultPath: join(carpeta, nombre), filters: [{ name: 'PDF', extensions: ['pdf'] }] }
          const ventana = BrowserWindow.fromWebContents(e.sender)
          const { canceled, filePath } = ventana ? await dialog.showSaveDialog(ventana, opciones) : await dialog.showSaveDialog(opciones)
          if (canceled || !filePath) return null
          ruta = filePath
        }
      }

      const pdf = await e.sender.printToPDF({ pageSize: 'A4', printBackground: true, margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 } })
      await mkdir(dirname(ruta), { recursive: true })
      await writeFile(ruta, pdf)
      const reporte = repo.reportes.guardar({
        alumnoId: datos.alumnoId,
        controlBaseId: datos.controlBaseId,
        controlActualId: datos.controlActualId,
        ruta,
        campos: datos.campos,
        nota: datos.nota
      })
      return { reporte, reemplazado: anterior !== null }
    }
  )

  ipcMain.handle(CANALES.reporteHistorial, (_e, alumnoId: string) => repo.reportes.listarPorAlumno(alumnoId))
  ipcMain.handle(CANALES.reporteQuitar, (_e, id: string) => repo.reportes.quitar(id))
  ipcMain.handle(CANALES.reporteAbrir, async (_e, id: string) => {
    await shell.openPath(reporteExistente(id).ruta)
  })
  ipcMain.handle(CANALES.reporteMostrar, (_e, id: string) => {
    shell.showItemInFolder(reporteExistente(id).ruta)
  })

  ipcMain.handle(CANALES.reporteWhatsApp, async (_e, id: string) => {
    const reporte = reporteExistente(id)
    const alumno = repo.alumnos.obtener(reporte.alumnoId)
    await copiarArchivoAlPortapapeles(reporte.ruta)

    const telefono = telefonoParaWhatsApp(alumno?.telefono)
    const texto = encodeURIComponent(mensajeDeReporte(alumno?.nombre ?? '', formatearFecha(reporte.fechaBase), formatearFecha(reporte.fechaActual)))
    const conTelefono = telefono !== null
    // WhatsApp de escritorio si está instalado; si no, WhatsApp Web en el navegador.
    const escritorio = app.getApplicationNameForProtocol('whatsapp://') !== ''
    const url = escritorio
      ? `whatsapp://send?${conTelefono ? `phone=${telefono}&` : ''}text=${texto}`
      : `https://web.whatsapp.com/send?${conTelefono ? `phone=${telefono}&` : ''}text=${texto}`
    // FITNESS_SIN_ABRIR: solo para pruebas automáticas, no abre WhatsApp.
    if (process.env.FITNESS_SIN_ABRIR) console.log('WhatsApp:', url)
    else await shell.openExternal(url)
    return { conTelefono, destino: escritorio ? ('escritorio' as const) : ('web' as const) }
  })
}
