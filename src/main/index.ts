import { join } from 'node:path'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
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
  ipcMain.handle(CANALES.controlesListar, (_e, alumnoId: string) => repo.controles.listarPorAlumno(alumnoId))
  ipcMain.handle(CANALES.controlesCrear, (_e, datos) => repo.controles.crear(datos))
  ipcMain.handle(CANALES.controlesActualizar, (_e, id: string, cambios) => repo.controles.actualizar(id, cambios))
  ipcMain.handle(CANALES.controlesEliminar, (_e, id: string) => repo.controles.eliminar(id))
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
