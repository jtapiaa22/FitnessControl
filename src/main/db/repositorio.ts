import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type { Alumno, AlumnoConResumen, AlumnoNuevo, Configuracion, ReporteGuardado, CampoReporte, Control, ControlNuevo } from '@shared/tipos'

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

const SQL_REPORTE = `
  SELECT r.*, cb.fecha AS fecha_base, ca.fecha AS fecha_actual
  FROM reporte r
  JOIN control cb ON cb.id = r.control_base_id
  JOIN control ca ON ca.id = r.control_actual_id`

function filaAReporte(f: Fila): ReporteGuardado {
  const o = Object.fromEntries(Object.entries(f).map(([k, v]) => [aCamel(k), v])) as Record<string, unknown>
  return { ...(o as unknown as ReporteGuardado), campos: JSON.parse(o.campos as string) as CampoReporte[] }
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
      listar({ incluirArchivados = false }: { incluirArchivados?: boolean } = {}): AlumnoConResumen[] {
        const sql = `
          SELECT a.*,
                 (SELECT MAX(c.fecha) FROM control c WHERE c.alumno_id = a.id) AS ultimo_control,
                 (SELECT COUNT(*) FROM control c WHERE c.alumno_id = a.id) AS cantidad_controles
          FROM alumno a
          ${incluirArchivados ? '' : 'WHERE a.archivado = 0'}
          ORDER BY a.nombre COLLATE NOCASE`
        return (db.prepare(sql).all() as Fila[]).map((f) => filaAAlumno(f) as AlumnoConResumen)
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
      },
      /** Borrado definitivo, con todos sus Controles. La UI pide doble confirmación. */
      eliminar(id: string): void {
        db.prepare('DELETE FROM alumno WHERE id = ?').run(id)
      }
    },
    reportes: {
      listarPorAlumno(alumnoId: string): ReporteGuardado[] {
        return (db.prepare(`${SQL_REPORTE} WHERE r.alumno_id = ? ORDER BY r.actualizado_en DESC`).all(alumnoId) as Fila[]).map(filaAReporte)
      },
      obtener(id: string): ReporteGuardado | null {
        const f = db.prepare(`${SQL_REPORTE} WHERE r.id = ?`).get(id) as Fila | undefined
        return f ? filaAReporte(f) : null
      },
      buscarPar(alumnoId: string, controlBaseId: string, controlActualId: string): ReporteGuardado | null {
        const f = db
          .prepare(`${SQL_REPORTE} WHERE r.alumno_id = ? AND r.control_base_id = ? AND r.control_actual_id = ?`)
          .get(alumnoId, controlBaseId, controlActualId) as Fila | undefined
        return f ? filaAReporte(f) : null
      },
      /** Guarda el Reporte; si ya había uno del mismo par de Controles, lo reemplaza. */
      guardar(datos: { alumnoId: string; controlBaseId: string; controlActualId: string; ruta: string; campos: CampoReporte[]; nota: string | null }): ReporteGuardado {
        const t = ahora()
        db.prepare(
          `INSERT INTO reporte (id, alumno_id, control_base_id, control_actual_id, ruta, campos, nota, creado_en, actualizado_en)
           VALUES (@id, @alumnoId, @controlBaseId, @controlActualId, @ruta, @campos, @nota, @t, @t)
           ON CONFLICT (alumno_id, control_base_id, control_actual_id)
           DO UPDATE SET ruta = excluded.ruta, campos = excluded.campos, nota = excluded.nota, actualizado_en = excluded.actualizado_en`
        ).run({ ...datos, id: randomUUID(), campos: JSON.stringify(datos.campos), t })
        return this.buscarPar(datos.alumnoId, datos.controlBaseId, datos.controlActualId)!
      },
      /** Quita el Reporte del historial (el archivo PDF no se toca). */
      quitar(id: string): void {
        db.prepare('DELETE FROM reporte WHERE id = ?').run(id)
      }
    },
    configuracion: {
      obtener(): Configuracion {
        const filas = db.prepare('SELECT clave, valor FROM configuracion').all() as { clave: string; valor: string | null }[]
        const m = new Map(filas.map((f) => [f.clave, f.valor]))
        const v = (clave: keyof Configuracion) => m.get(clave) ?? null
        return {
          nombreInstructora: v('nombreInstructora'),
          contacto: v('contacto'),
          logo: v('logo'),
          carpetaBackup: v('carpetaBackup'),
          ultimoBackup: v('ultimoBackup'),
          errorBackup: v('errorBackup')
        }
      },
      guardar(cambios: Partial<Configuracion>): Configuracion {
        const stmt = db.prepare(
          'INSERT INTO configuracion (clave, valor, actualizado_en) VALUES (?, ?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado_en = excluded.actualizado_en'
        )
        const permitidas: (keyof Configuracion)[] = ['nombreInstructora', 'contacto', 'logo', 'carpetaBackup', 'ultimoBackup', 'errorBackup']
        db.transaction(() => {
          for (const clave of permitidas) if (clave in cambios) stmt.run(clave, cambios[clave] ?? null, ahora())
        })()
        return this.obtener()
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
