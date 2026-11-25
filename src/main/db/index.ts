import { join } from 'node:path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { migrar } from './esquema'

/** Ruta de la base local, en la carpeta de datos del usuario. Ver docs/adr/0001. */
export const rutaBaseDeDatos = (): string => join(app.getPath('userData'), 'fitness-control.db')

/** Abre (o crea) la base local y aplica las migraciones pendientes. */
export function abrirBaseDeDatos(): Database.Database {
  const db = new Database(rutaBaseDeDatos())
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrar(db)
  return db
}
