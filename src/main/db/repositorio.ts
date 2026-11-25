import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type { Alumno, AlumnoNuevo, CampoReporte, Control, ControlNuevo } from '@shared/tipos'

type Fila = Record<string, unknown>

const aSnake = (s: string): string => s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
const aCamel = (s: string): string => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())

// Columnas cuyo nombre no sale de convertir camelCase a snake_case.
const COLUMNAS_ESPECIALES: Record<string, string> = {
  creadoEn: 'creado_en',
  actualizadoEn: 'actualizado_en'
}
const columna = (campo: string): string => COLUMNAS_ESPECIALES[campo] ?? aSnake(campo)

const ahora = (): string => new Date().toISOString()

function filaAAlumno(f: Fila): Alumno {
  const o = Object.fromEntries(Object.entries(f).map(([k, v]) => [aCamel(k), v])) as Record<string, unknown>
  return {
    ...(o as unknown as Alumno),
    archivado: o.archivado === 1,
    camposReporte: o.camposReporte ? (JSON.parse(o.camposReporte as string) as CampoReporte[]) : null
  }
}

function filaAControl(f: Fila): Control {
  const o = Object.fromEntries(Object.entries(f).map(([k, v]) => [aCamel(k), v])) as Record<string, unknown>
  return { ...(o as unknown as Control), ambosLados: o.ambosLados === 1 }
}

/** Convierte un objeto del dominio a parámetros con nombre de columna SQL. */
function aParametros(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    out[columna(k)] = typeof v === 'boolean' ? (v ? 1 : 0) : Array.isArray(v) ? JSON.stringify(v) : v
  }
  return out
}

function insertar(db: Database.Database, tabla: string, params: Record<string, unknown>): void {
  const cols = Object.keys(params)
  db.prepare(`INSERT INTO ${tabla} (${cols.join(', ')}) VALUES (${cols.map((c) => `@${c}`).join(', ')})`).run(params)
}

function actualizarFila(db: Database.Database, tabla: string, id: string, params: Record<string, unknown>): void {
  const cols = Object.keys(params).filter((c) => c !== 'id')
  if (cols.length === 0) return
  db.prepare(`UPDATE ${tabla} SET ${cols.map((c) => `${c} = @${c}`).join(', ')} WHERE id = @id`).run({ ...params, id })
}

export function crearRepositorio(db: Database.Database) {
  const obtenerAlumno = (id: string): Alumno | null => {
    const f = db.prepare('SELECT * FROM alumno WHERE id = ?').get(id) as Fila | undefined
    return f ? filaAAlumno(f) : null
  }
  const obtenerControl = (id: string): Control | null => {
    const f = db.prepare('SELECT * FROM control WHERE id = ?').get(id) as Fila | undefined
    return f ? filaAControl(f) : null
  }

  return {
    alumnos: {
      listar({ incluirArchivados = false }: { incluirArchivados?: boolean } = {}): Alumno[] {
        const sql = incluirArchivados
          ? 'SELECT * FROM alumno ORDER BY nombre COLLATE NOCASE'
          : 'SELECT * FROM alumno WHERE archivado = 0 ORDER BY nombre COLLATE NOCASE'
        return (db.prepare(sql).all() as Fila[]).map(filaAAlumno)
      },
      obtener: obtenerAlumno,
      crear(datos: AlumnoNuevo): Alumno {
        const id = randomUUID()
        const t = ahora()
        insertar(db, 'alumno', aParametros({ ...datos, id, archivado: false, creadoEn: t, actualizadoEn: t }))
        return obtenerAlumno(id)!
      },
      actualizar(id: string, cambios: Partial<Alumno>): Alumno {
        const { id: _i, creadoEn: _c, ...resto } = cambios
        actualizarFila(db, 'alumno', id, aParametros({ ...resto, actualizadoEn: ahora() }))
        const a = obtenerAlumno(id)
        if (!a) throw new Error(`No existe el alumno ${id}`)
        return a
      }
    },
    controles: {
      listarPorAlumno(alumnoId: string): Control[] {
        return (
          db.prepare('SELECT * FROM control WHERE alumno_id = ? ORDER BY fecha, creado_en').all(alumnoId) as Fila[]
        ).map(filaAControl)
      },
      crear(datos: ControlNuevo): Control {
        const id = randomUUID()
        const t = ahora()
        insertar(db, 'control', aParametros({ ...datos, id, creadoEn: t, actualizadoEn: t }))
        return obtenerControl(id)!
      },
      actualizar(id: string, cambios: Partial<Control>): Control {
        const { id: _i, alumnoId: _a, creadoEn: _c, ...resto } = cambios
        actualizarFila(db, 'control', id, aParametros({ ...resto, actualizadoEn: ahora() }))
        const c = obtenerControl(id)
        if (!c) throw new Error(`No existe el control ${id}`)
        return c
      },
      eliminar(id: string): void {
        db.prepare('DELETE FROM control WHERE id = ?').run(id)
      }
    }
  }
}

export type Repositorio = ReturnType<typeof crearRepositorio>
