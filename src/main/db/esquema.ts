import type Database from 'better-sqlite3'

/**
 * Migraciones en orden. Cada una corre una sola vez; la versión aplicada se
 * guarda en `PRAGMA user_version`. Nunca editar una migración ya publicada:
 * agregar una nueva al final.
 *
 * IDs UUID y marcas de creado/actualizado en cada tabla: ver docs/adr/0001.
 */
const MIGRACIONES: string[] = [
  `
  CREATE TABLE alumno (
    id                TEXT PRIMARY KEY,
    nombre            TEXT NOT NULL,
    telefono          TEXT,
    fecha_nacimiento  TEXT,
    sexo              TEXT CHECK (sexo IN ('femenino', 'masculino')),
    notas             TEXT,
    altura_m          REAL,
    objetivo          TEXT NOT NULL DEFAULT 'mantener' CHECK (objetivo IN ('bajar', 'subir', 'mantener')),
    frecuencia_dias   INTEGER NOT NULL DEFAULT 7 CHECK (frecuencia_dias > 0),
    archivado         INTEGER NOT NULL DEFAULT 0,
    campos_reporte    TEXT,
    creado_en         TEXT NOT NULL,
    actualizado_en    TEXT NOT NULL
  );

  CREATE TABLE control (
    id                      TEXT PRIMARY KEY,
    alumno_id               TEXT NOT NULL REFERENCES alumno(id) ON DELETE CASCADE,
    fecha                   TEXT NOT NULL,
    altura_m                REAL,
    peso_kg                 REAL,
    grasa_pct               REAL,
    musculo_kg              REAL,
    grasa_visceral          REAL,
    masa_osea_kg            REAL,
    proteina_pct            REAL,
    metabolismo_basal_kcal  REAL,
    pecho_cm                REAL,
    cintura_cm              REAL,
    cadera_cm               REAL,
    ambos_lados             INTEGER NOT NULL DEFAULT 0,
    muslo_izq_cm             REAL,
    muslo_der_cm            REAL,
    brazo_relajado_izq_cm    REAL,
    brazo_relajado_der_cm   REAL,
    brazo_contraido_izq_cm   REAL,
    brazo_contraido_der_cm  REAL,
    nota_reporte            TEXT,
    creado_en               TEXT NOT NULL,
    actualizado_en          TEXT NOT NULL
  );

  CREATE INDEX control_alumno_fecha ON control (alumno_id, fecha);
  `,
  `
  CREATE TABLE configuracion (
    clave           TEXT PRIMARY KEY,
    valor           TEXT,
    actualizado_en  TEXT NOT NULL
  );
  `
]

export function migrar(db: Database.Database): void {
  const versionActual = db.pragma('user_version', { simple: true }) as number
  for (let i = versionActual; i < MIGRACIONES.length; i++) {
    db.transaction(() => {
      db.exec(MIGRACIONES[i]!)
      db.pragma(`user_version = ${i + 1}`)
    })()
  }
}
