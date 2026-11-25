// Copias de seguridad de la base local. Ver docs/requisitos-iniciales.md ("Backup").
// - Al cerrar la app se guarda una copia por día en la carpeta elegida (por defecto
//   Documentos\FitnessControl\Copias). Se conservan las últimas COPIAS_A_CONSERVAR.
// - Restaurar reemplaza la base actual por una copia, guardando antes la actual.
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { hoyLocal } from '@shared/formato'
import type { Repositorio } from './db/repositorio'
import { VERSION_ESQUEMA } from './db/esquema'

const COPIAS_A_CONSERVAR = 30
const PATRON_COPIA = /^FitnessControl-\d{4}-\d{2}-\d{2}\.db$/

export interface ResumenCopia {
  alumnos: number
  controles: number
}

export function carpetaPorDefecto(): string {
  return join(app.getPath('documents'), 'FitnessControl', 'Copias')
}

export function crearBackup(db: Database.Database, repo: Repositorio, rutaBase: string) {
  const carpetaActual = (): string => repo.configuracion.obtener().carpetaBackup ?? carpetaPorDefecto()

  /** Guarda la copia del día (si ya existe la reemplaza) y borra las más viejas. */
  async function hacerCopia(): Promise<string> {
    const carpeta = carpetaActual()
    try {
      await mkdir(carpeta, { recursive: true })
      const destino = join(carpeta, `FitnessControl-${hoyLocal()}.db`)
      await db.backup(destino)
      // La copia queda como un único archivo (sin -wal/-shm), cómodo para Drive/OneDrive.
      const copia = new Database(destino)
      copia.pragma('journal_mode = DELETE')
      copia.close()
      await podar(carpeta)
      repo.configuracion.guardar({ ultimoBackup: new Date().toISOString(), errorBackup: null })
      return destino
    } catch (e) {
      repo.configuracion.guardar({ errorBackup: `${new Date().toISOString()} · ${(e as Error).message}` })
      throw e
    }
  }

  async function podar(carpeta: string): Promise<void> {
    const copias = (await readdir(carpeta)).filter((f) => PATRON_COPIA.test(f)).sort()
    for (const vieja of copias.slice(0, Math.max(0, copias.length - COPIAS_A_CONSERVAR))) {
      await rm(join(carpeta, vieja))
    }
  }

  /** Revisa que el archivo sea una base de FitnessControl y cuenta lo que tiene. */
  function revisar(ruta: string): ResumenCopia {
    let copia: Database.Database | null = null
    try {
      copia = new Database(ruta, { readonly: true, fileMustExist: true })
      const version = copia.pragma('user_version', { simple: true }) as number
      if (version < 1) throw new Error('vacía')
      if (version > VERSION_ESQUEMA) throw new Error('La copia es de una versión más nueva de FitnessControl. Actualizá la app primero.')
      const alumnos = (copia.prepare('SELECT COUNT(*) AS n FROM alumno').get() as { n: number }).n
      const controles = (copia.prepare('SELECT COUNT(*) AS n FROM control').get() as { n: number }).n
      return { alumnos, controles }
    } catch (e) {
      const mensaje = (e as Error).message
      throw new Error(mensaje.startsWith('La copia') ? mensaje : 'El archivo elegido no es una copia válida de FitnessControl.')
    } finally {
      copia?.close()
    }
  }

  /**
   * Reemplaza la base actual por la copia y reinicia la app. Antes guarda la base
   * actual en la carpeta de datos, por si hay que volver atrás.
   */
  async function restaurar(ruta: string): Promise<void> {
    revisar(ruta)
    const marca = new Date().toISOString().replace(/[:.]/g, '-')
    await db.backup(join(app.getPath('userData'), `antes-de-restaurar-${marca}.db`))
    db.close()
    await rm(`${rutaBase}-wal`, { force: true })
    await rm(`${rutaBase}-shm`, { force: true })
    await copyFile(ruta, rutaBase)
    app.relaunch()
    app.exit(0)
  }

  return { carpetaActual, hacerCopia, revisar, restaurar }
}

export type Backup = ReturnType<typeof crearBackup>
