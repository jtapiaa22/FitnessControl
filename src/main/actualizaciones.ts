// Actualizaciones automáticas desde GitHub Releases (mismo esquema que KioscoApp).
// - `npm run release` publica la versión nueva (instalador + latest.yml) en GitHub.
// - La app instalada busca versiones nuevas al arrancar y cada 4 horas, y las descarga sola.
// - La instalación NUNCA interrumpe: se hace al cerrar la app, o cuando la Instructora toca
//   "Reiniciar y actualizar".
import { app, BrowserWindow, ipcMain } from 'electron'
import electronUpdater from 'electron-updater'
import { CANALES, type EstadoActualizacion } from '@shared/api'

const { autoUpdater } = electronUpdater

const PRIMER_CHEQUEO_MS = 15_000
const CADA_CUANTO_MS = 4 * 60 * 60 * 1000

let estadoActual: EstadoActualizacion = { tipo: 'inactivo' }

/** Los errores de electron-updater vienen en inglés y técnicos: se traducen los habituales. */
function enCastellano(mensaje: string): string {
  if (/No published versions/i.test(mensaje)) return 'todavía no hay ninguna versión publicada.'
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|net::/i.test(mensaje)) return 'no hay conexión a internet.'
  if (/40[13]/.test(mensaje)) return 'GitHub no permitió el acceso a las actualizaciones.'
  return mensaje.split('\n')[0] ?? mensaje
}

function emitir(estado: EstadoActualizacion): void {
  estadoActual = estado
  for (const ventana of BrowserWindow.getAllWindows()) ventana.webContents.send(CANALES.actualizacionEstado, estado)
}

export function registrarActualizaciones(): void {
  ipcMain.handle(CANALES.actualizacionEstadoActual, () => estadoActual)
  ipcMain.handle(CANALES.actualizacionBuscar, async () => {
    if (!app.isPackaged) throw new Error('Las actualizaciones solo funcionan en la app instalada, no en modo desarrollo.')
    try {
      await autoUpdater.checkForUpdates()
    } catch (e) {
      throw new Error(enCastellano((e as Error).message))
    }
  })
  ipcMain.handle(CANALES.actualizacionInstalar, () => {
    if (estadoActual.tipo !== 'descargada') throw new Error('No hay ninguna actualización descargada para instalar.')
    // setImmediate: que el IPC responda antes de cerrar. Al cerrar se hace igual la copia de seguridad.
    setImmediate(() => autoUpdater.quitAndInstall(false, true))
  })

  if (!app.isPackaged) return

  // Si algún día el repo pasa a ser privado: token de solo lectura embebido al compilar
  // (FITNESS_UPDATE_TOKEN=... npm run release), como en KioscoApp. Hoy el repo es público.
  const token = process.env.FITNESS_UPDATE_TOKEN
  if (token) autoUpdater.setFeedURL({ provider: 'github', owner: 'jtapiaa22', repo: 'FitnessControl', private: true, token })

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => emitir({ tipo: 'buscando' }))
  autoUpdater.on('update-available', (info) => emitir({ tipo: 'disponible', version: info.version }))
  autoUpdater.on('update-not-available', () => emitir({ tipo: 'al-dia', version: app.getVersion() }))
  autoUpdater.on('download-progress', (p) => emitir({ tipo: 'descargando', porcentaje: Math.round(p.percent) }))
  autoUpdater.on('update-downloaded', (info) => emitir({ tipo: 'descargada', version: info.version }))
  autoUpdater.on('error', (err) => {
    console.error('Actualizaciones:', err)
    emitir({ tipo: 'error', mensaje: enCastellano(err.message) })
  })

  const buscar = () => autoUpdater.checkForUpdates().catch((err) => console.error('checkForUpdates:', err))
  setTimeout(buscar, PRIMER_CHEQUEO_MS)
  setInterval(buscar, CADA_CUANTO_MS)
}
