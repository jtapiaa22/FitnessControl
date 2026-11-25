import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { CANALES } from '@shared/api'
import { abrirBaseDeDatos } from './db'
import { crearRepositorio } from './db/repositorio'

function crearVentana(): void {
  const ventana = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: 'FitnessControl',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  ventana.on('ready-to-show', () => ventana.show())

  // Los links externos se abren en el navegador, nunca dentro de la app.
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    void ventana.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void ventana.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registrarIpc(): void {
  const db = abrirBaseDeDatos()
  const repo = crearRepositorio(db)
  app.on('will-quit', () => db.close())

  ipcMain.handle(CANALES.alumnosListar, (_e, opciones) => repo.alumnos.listar(opciones))
  ipcMain.handle(CANALES.alumnosObtener, (_e, id: string) => repo.alumnos.obtener(id))
  ipcMain.handle(CANALES.alumnosCrear, (_e, datos) => repo.alumnos.crear(datos))
  ipcMain.handle(CANALES.alumnosActualizar, (_e, id: string, cambios) => repo.alumnos.actualizar(id, cambios))
  ipcMain.handle(CANALES.alumnosEliminar, (_e, id: string) => repo.alumnos.eliminar(id))
  ipcMain.handle(CANALES.controlesListar, (_e, alumnoId: string) => repo.controles.listarPorAlumno(alumnoId))
  ipcMain.handle(CANALES.controlesCrear, (_e, datos) => repo.controles.crear(datos))
  ipcMain.handle(CANALES.controlesActualizar, (_e, id: string, cambios) => repo.controles.actualizar(id, cambios))
  ipcMain.handle(CANALES.controlesEliminar, (_e, id: string) => repo.controles.eliminar(id))
  ipcMain.handle(CANALES.configuracionObtener, () => repo.configuracion.obtener())
  ipcMain.handle(CANALES.configuracionGuardar, (_e, cambios) => repo.configuracion.guardar(cambios))
  registrarReporte()
}

/** PDF del Reporte: imprime la pantalla actual con sus estilos @media print. */
function registrarReporte(): void {
  // Solo se abren archivos que esta app generó en esta sesión.
  const generados = new Set<string>()

  ipcMain.handle(CANALES.reporteGuardarPdf, async (e, nombreSugerido: string) => {
    const ventana = BrowserWindow.fromWebContents(e.sender)
    const nombre = `${nombreSugerido.replace(/[\\/:*?"<>|]/g, '-')}.pdf`
    const opciones = { title: 'Guardar reporte', defaultPath: join(app.getPath('documents'), nombre), filters: [{ name: 'PDF', extensions: ['pdf'] }] }
    // FITNESS_PDF_DESTINO: solo para pruebas automáticas, evita el diálogo de guardar.
    const destinoDePrueba = process.env.FITNESS_PDF_DESTINO
    const { canceled, filePath } = destinoDePrueba
      ? { canceled: false, filePath: join(destinoDePrueba, nombre) }
      : ventana
        ? await dialog.showSaveDialog(ventana, opciones)
        : await dialog.showSaveDialog(opciones)
    if (canceled || !filePath) return null
    const pdf = await e.sender.printToPDF({ pageSize: 'A4', printBackground: true, margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 } })
    await writeFile(filePath, pdf)
    generados.add(filePath)
    return filePath
  })
  ipcMain.handle(CANALES.reporteAbrir, async (_e, ruta: string) => {
    if (generados.has(ruta)) await shell.openPath(ruta)
  })
  ipcMain.handle(CANALES.reporteMostrar, (_e, ruta: string) => {
    if (generados.has(ruta)) shell.showItemInFolder(ruta)
  })
}

app.whenReady().then(() => {
  registrarIpc()
  crearVentana()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
