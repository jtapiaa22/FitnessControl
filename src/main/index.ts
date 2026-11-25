import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { CANALES } from '@shared/api'
import { carpetaPorDefecto, crearBackup, restaurarSobreBaseDanada, type Backup } from './backup'
import { abrirBaseDeDatos, BaseDanadaError, rutaBaseDeDatos } from './db'
import { crearRepositorio, type Repositorio } from './db/repositorio'
import { registrarActualizaciones } from './actualizaciones'
import { carpetaDeDatos } from './carpetas'
import { registrarReportes } from './reportes'

// Desarrollo e instalada usan carpetas de datos distintas (ver carpetas.ts).
app.setPath('userData', carpetaDeDatos())

function crearVentana(): void {
  const ventana = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 640,
    minHeight: 560,
    show: false,
    title: 'FitnessControl',
    // En la app instalada Windows usa el ícono del .exe; en desarrollo, el de build/.
    ...(app.isPackaged ? {} : { icon: join(__dirname, '../../build/icon.png') }),
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
  const backup = crearBackup(db, repo, rutaBaseDeDatos())
  copiaAlCerrar(backup)
  app.on('will-quit', () => {
    if (db.open) db.close()
  })

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
  registrarReportes(repo)
  registrarActualizaciones()
  registrarBackup(backup, repo)
}

/** Al cerrar la app, primero se hace la copia del día y después se cierra. */
function copiaAlCerrar(backup: Backup): void {
  let hecha = false
  app.on('before-quit', (e) => {
    if (hecha) return
    e.preventDefault()
    hecha = true
    backup
      .hacerCopia()
      .catch((err: Error) => console.error('No se pudo hacer la copia al cerrar:', err.message))
      .finally(() => app.quit())
  })
}

function registrarBackup(backup: Backup, repo: Repositorio): void {
  // Solo se puede restaurar un archivo elegido en el diálogo y ya revisado.
  const elegidas = new Set<string>()
  const ventanaDe = (e: Electron.IpcMainInvokeEvent) => BrowserWindow.fromWebContents(e.sender) ?? undefined

  ipcMain.handle(CANALES.backupCarpeta, () => backup.carpetaActual())
  ipcMain.handle(CANALES.backupHacerCopia, () => backup.hacerCopia())
  ipcMain.handle(CANALES.backupAbrirCarpeta, async () => {
    await mkdir(backup.carpetaActual(), { recursive: true })
    await shell.openPath(backup.carpetaActual())
  })
  ipcMain.handle(CANALES.backupElegirCarpeta, async (e) => {
    const opciones: Electron.OpenDialogOptions = { title: 'Carpeta para las copias de seguridad', defaultPath: backup.carpetaActual(), properties: ['openDirectory', 'createDirectory'] }
    const ventana = ventanaDe(e)
    const { canceled, filePaths } = ventana ? await dialog.showOpenDialog(ventana, opciones) : await dialog.showOpenDialog(opciones)
    const carpeta = filePaths[0]
    if (canceled || !carpeta) return null
    repo.configuracion.guardar({ carpetaBackup: carpeta })
    return carpeta
  })
  ipcMain.handle(CANALES.backupElegirCopia, async (e) => {
    // FITNESS_COPIA_A_RESTAURAR: solo para pruebas automáticas, evita el diálogo.
    const dePrueba = process.env.FITNESS_COPIA_A_RESTAURAR
    const opciones: Electron.OpenDialogOptions = { title: 'Elegir copia para restaurar', defaultPath: backup.carpetaActual(), filters: [{ name: 'Copia de FitnessControl', extensions: ['db'] }], properties: ['openFile'] }
    const ventana = ventanaDe(e)
    const { canceled, filePaths } = dePrueba
      ? { canceled: false, filePaths: [dePrueba] }
      : ventana
        ? await dialog.showOpenDialog(ventana, opciones)
        : await dialog.showOpenDialog(opciones)
    const ruta = filePaths[0]
    if (canceled || !ruta) return null
    const resumen = backup.revisar(ruta)
    elegidas.add(ruta)
    return { ruta, ...resumen }
  })
  ipcMain.handle(CANALES.backupRestaurar, async (_e, ruta: string) => {
    if (!elegidas.has(ruta)) throw new Error('Elegí primero la copia a restaurar.')
    await backup.restaurar(ruta)
  })
}


// Una sola instancia: dos ventanas usando la misma base a la vez es buscar problemas.
if (!app.requestSingleInstanceLock()) {
  app.exit(0)
} else {
  app.on('second-instance', () => {
    const ventana = BrowserWindow.getAllWindows()[0]
    if (ventana) {
      if (ventana.isMinimized()) ventana.restore()
      ventana.focus()
    }
  })

  app.whenReady().then(async () => {
    try {
      registrarIpc()
    } catch (e) {
      if (e instanceof BaseDanadaError) return ofrecerRestaurar(e)
      throw e
    }
    crearVentana()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) crearVentana()
    })
  })
}

/** La base no se pudo abrir: se ofrece restaurar una copia en vez de seguir. */
async function ofrecerRestaurar(error: Error): Promise<void> {
  console.error('Base dañada:', error.message)
  const { response } = await dialog.showMessageBox({
    type: 'error',
    title: 'FitnessControl',
    message: 'No se pudieron abrir tus datos.',
    detail:
      'El archivo de datos parece dañado. Podés restaurar una de tus copias de seguridad (se guarda una cada vez que cerrás la app). ' +
      'El archivo dañado no se borra: queda apartado en la carpeta de datos.',
    buttons: ['Restaurar una copia…', 'Cerrar'],
    defaultId: 0,
    cancelId: 1
  })
  if (response !== 0) return app.exit(1)
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Elegir copia para restaurar',
    defaultPath: carpetaPorDefecto(),
    filters: [{ name: 'Copia de FitnessControl', extensions: ['db'] }],
    properties: ['openFile']
  })
  const ruta = filePaths[0]
  if (canceled || !ruta) return app.exit(1)
  try {
    await restaurarSobreBaseDanada(ruta, rutaBaseDeDatos())
  } catch (e) {
    dialog.showErrorBox('FitnessControl', (e as Error).message)
    app.exit(1)
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
