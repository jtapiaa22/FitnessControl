import { join } from 'node:path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { migrar } from './esquema'

/** Abre (o crea) la base local en la carpeta de datos del usuario. Ver docs/adr/0001. */
export function abrirBaseDeDatos(): Database.Database {
  const ruta = join(app.getPath('userData'), 'fitness-control.db')
  const db = new Database(ruta)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrar(db)
  return db
}
