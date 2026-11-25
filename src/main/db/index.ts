import { join } from 'node:path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { migrar } from './esquema'

/** Ruta de la base local, en la carpeta de datos del usuario. Ver docs/adr/0001. */
export const rutaBaseDeDatos = (): string => join(app.getPath('userData'), 'fitness-control.db')

export class BaseDanadaError extends Error {}

/**
 * Abre (o crea) la base local y aplica las migraciones pendientes.
 *
 * Usa el diario clásico de SQLite (journal_mode = DELETE) y no WAL: es una app de
 * un solo usuario, y así la base es un único archivo, sin -wal/-shm al lado que un
 * cierre brusco, OneDrive o un antivirus puedan dejar desparejos (ver docs/adr/0002).
 * Si la base no pasa el chequeo de integridad, no se sigue: se avisa para restaurar.
 */
export function abrirBaseDeDatos(): Database.Database {
  const db = new Database(rutaBaseDeDatos())
  try {
    db.pragma('journal_mode = DELETE')
    db.pragma('synchronous = FULL')
    db.pragma('foreign_keys = ON')
    const chequeo = db.pragma('quick_check', { simple: true })
    if (chequeo !== 'ok') throw new Error(String(chequeo))
  } catch (e) {
    db.close()
    throw new BaseDanadaError((e as Error).message)
  }
  migrar(db)
  return db
}
