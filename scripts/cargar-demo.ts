// Carga alumnos de ejemplo en la base local para probar la app.
//   npm run demo            → carga los alumnos de ejemplo
//   npm run demo -- --borrar → borra solo los alumnos de ejemplo
// Los alumnos de ejemplo terminan sus notas con "(alumno de ejemplo)"; nunca se tocan otros.
// (También borra los de versiones anteriores, marcados con "[Demo]" al principio.)
// Cerrá la app antes de correrlo.
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { migrar } from '../src/main/db/esquema.ts'
import { crearRepositorio } from '../src/main/db/repositorio.ts'

const MARCA = '(alumno de ejemplo)'
const ruta = join(process.env.APPDATA ?? '', 'fitness-control', 'fitness-control.db')
const db = new Database(ruta)
db.pragma('journal_mode = DELETE')
db.pragma('foreign_keys = ON')
migrar(db)
const repo = crearRepositorio(db)

const borrados = db.prepare(`DELETE FROM alumno WHERE notas LIKE '%${MARCA}' OR notas LIKE '[Demo]%'`).run().changes
if (process.argv.includes('--borrar')) {
  console.log(`Borrados ${borrados} alumnos de ejemplo de ${ruta}`)
  process.exit(0)
}

// Fecha local de hoy menos `dias`, como YYYY-MM-DD.
const haceDias = (dias: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const r = (v: number, dec = 1) => Math.round(v * 10 ** dec) / 10 ** dec

interface Punto {
  dias: number
  peso: number
  grasa: number
  visceral: number
  pecho: number
  cintura: number
  cadera: number
  muslo: number
  brazo: number
  brazoF: number
  /** Diferencia del lado derecho respecto del izquierdo, en cm. */
  difDer?: number
  ambos?: boolean
  /** Lado medido cuando no son ambos. */
  lado?: 'izq' | 'der'
}

function cargar(alumno: Parameters<typeof repo.alumnos.crear>[0], puntos: Punto[], extras: { archivado?: boolean; osea: number; metabolismo: number } ) {
  const a = repo.alumnos.crear({ ...alumno, notas: `${alumno.notas ?? ''} ${MARCA}`.trim() })
  for (const p of puntos) {
    const grasaKg = (p.peso * p.grasa) / 100
    const musculo = p.peso - grasaKg - extras.osea // como la balanza: músculo + grasa + hueso = peso
    const der = p.difDer ?? 0.5
    const lado = p.ambos ? null : (p.lado ?? 'izq')
    const izq = (v: number) => (p.ambos || lado === 'izq' ? r(v) : null)
    const derecho = (v: number) => (p.ambos || lado === 'der' ? r(v + der) : null)
    repo.controles.crear({
      alumnoId: a.id,
      fecha: haceDias(p.dias),
      alturaM: alumno.alturaM,
      pesoKg: r(p.peso, 2),
      grasaPct: r(p.grasa),
      musculoKg: r(musculo, 2),
      grasaVisceral: p.visceral,
      masaOseaKg: extras.osea,
      proteinaPct: r(16 + (30 - p.grasa) * 0.12),
      metabolismoBasalKcal: Math.round(extras.metabolismo + (musculo - 36) * 18),
      pechoCm: r(p.pecho),
      cinturaCm: r(p.cintura),
      caderaCm: r(p.cadera),
      ambosLados: !!p.ambos,
      musloIzqCm: izq(p.muslo),
      musloDerCm: derecho(p.muslo),
      brazoRelajadoIzqCm: izq(p.brazo),
      brazoRelajadoDerCm: derecho(p.brazo),
      brazoContraidoIzqCm: izq(p.brazoF),
      brazoContraidoDerCm: derecho(p.brazoF),
      notaReporte: null
    })
  }
  if (extras.archivado) repo.alumnos.actualizar(a.id, { archivado: true })
  return a.nombre
}

const cargados: string[] = []

// 1. Bajar de peso, control semanal. Empieza midiendo un lado y desde el 3er control mide ambos.
cargados.push(
  cargar(
    { nombre: 'Sofía Martínez', telefono: '381 555-1201', fechaNacimiento: '1994-03-12', sexo: 'femenino', notas: 'Quiere bajar de peso para el verano. Rodilla derecha sensible.', alturaM: 1.62, objetivo: 'bajar', frecuenciaDias: 7 },
    [
      { dias: 49, peso: 62.4, grasa: 33.1, visceral: 6, pecho: 92, cintura: 78, cadera: 102, muslo: 56, brazo: 28.5, brazoF: 29.5 },
      { dias: 42, peso: 61.8, grasa: 32.6, visceral: 6, pecho: 91.5, cintura: 77, cadera: 101.5, muslo: 55.5, brazo: 28.3, brazoF: 29.4 },
      { dias: 35, peso: 61.1, grasa: 32.0, visceral: 6, pecho: 91, cintura: 76, cadera: 101, muslo: 55, brazo: 28, brazoF: 29.3, ambos: true, difDer: 0.6 },
      { dias: 28, peso: 60.3, grasa: 31.4, visceral: 5, pecho: 90.5, cintura: 75, cadera: 100, muslo: 54.5, brazo: 27.8, brazoF: 29.2, ambos: true, difDer: 0.6 },
      { dias: 21, peso: 59.9, grasa: 31.0, visceral: 5, pecho: 90.5, cintura: 74.5, cadera: 99.5, muslo: 54, brazo: 27.6, brazoF: 29.2, ambos: true, difDer: 0.5 },
      { dias: 14, peso: 59.1, grasa: 30.2, visceral: 5, pecho: 90, cintura: 73.5, cadera: 99, muslo: 53.5, brazo: 27.5, brazoF: 29.3, ambos: true, difDer: 0.5 },
      { dias: 7, peso: 58.6, grasa: 29.8, visceral: 5, pecho: 89.5, cintura: 72.5, cadera: 98, muslo: 53, brazo: 27.3, brazoF: 29.4, ambos: true, difDer: 0.4 },
      { dias: 0, peso: 58.0, grasa: 29.1, visceral: 4, pecho: 89, cintura: 71.5, cadera: 97.5, muslo: 52.5, brazo: 27.2, brazoF: 29.5, ambos: true, difDer: 0.4 }
    ],
    { osea: 2.2, metabolismo: 1150 }
  )
)

// 2. Ganar músculo, control cada 14 días, siempre ambos lados.
cargados.push(
  cargar(
    { nombre: 'Lucas Fernández', telefono: '381 555-3344', fechaNacimiento: '1999-08-25', sexo: 'masculino', notas: 'Objetivo: ganar masa muscular. Entrena 4 veces por semana.', alturaM: 1.78, objetivo: 'subir', frecuenciaDias: 14 },
    [
      { dias: 70, peso: 71.0, grasa: 17.5, visceral: 5, pecho: 96, cintura: 80, cadera: 94, muslo: 54, brazo: 31, brazoF: 33.5, ambos: true, difDer: 0.3 },
      { dias: 56, peso: 71.8, grasa: 17.3, visceral: 5, pecho: 97, cintura: 80, cadera: 94.5, muslo: 54.5, brazo: 31.4, brazoF: 34, ambos: true, difDer: 0.3 },
      { dias: 42, peso: 72.6, grasa: 17.2, visceral: 5, pecho: 98, cintura: 80.5, cadera: 95, muslo: 55, brazo: 31.8, brazoF: 34.6, ambos: true, difDer: 0.4 },
      { dias: 28, peso: 73.1, grasa: 16.8, visceral: 5, pecho: 98.5, cintura: 80, cadera: 95, muslo: 55.5, brazo: 32.1, brazoF: 35, ambos: true, difDer: 0.4 },
      { dias: 14, peso: 73.9, grasa: 16.6, visceral: 4, pecho: 99.5, cintura: 80, cadera: 95.5, muslo: 56, brazo: 32.5, brazoF: 35.6, ambos: true, difDer: 0.3 }
    ],
    { osea: 3.1, metabolismo: 1650 }
  )
)

// 3. Mantener, control cada 10 días. Último control hace 16 días → pendiente.
cargados.push(
  cargar(
    { nombre: 'Valentina Ríos', telefono: '381 555-7788', fechaNacimiento: '1988-11-02', sexo: 'femenino', notas: 'Mantenimiento. Corre 10 km los fines de semana.', alturaM: 1.68, objetivo: 'mantener', frecuenciaDias: 10 },
    [
      { dias: 36, peso: 59.5, grasa: 24.5, visceral: 3, pecho: 88, cintura: 67, cadera: 95, muslo: 52, brazo: 26, brazoF: 27.5, lado: 'der' },
      { dias: 26, peso: 59.2, grasa: 24.2, visceral: 3, pecho: 88, cintura: 66.5, cadera: 95, muslo: 52, brazo: 26, brazoF: 27.6, lado: 'der' },
      { dias: 16, peso: 59.6, grasa: 24.4, visceral: 3, pecho: 88.5, cintura: 67, cadera: 95.5, muslo: 52.5, brazo: 26.1, brazoF: 27.8, lado: 'der' }
    ],
    { osea: 2.3, metabolismo: 1250 }
  )
)

// 4. Alumno nuevo, sin controles todavía → "Primer control".
repo.alumnos.crear({ nombre: 'Martín Gómez', telefono: '381 555-9090', fechaNacimiento: '1985-05-17', sexo: 'masculino', notas: `Arranca la semana que viene. ${MARCA}`, alturaM: 1.74, objetivo: 'bajar', frecuenciaDias: 7 })
cargados.push('Martín Gómez')

// 5. Alumna archivada (dejó de venir).
cargados.push(
  cargar(
    { nombre: 'Carla Suárez', telefono: '381 555-4321', fechaNacimiento: '1996-01-30', sexo: 'femenino', notas: 'Dejó en octubre por trabajo.', alturaM: 1.6, objetivo: 'bajar', frecuenciaDias: 7 },
    [
      { dias: 75, peso: 66.0, grasa: 35.0, visceral: 7, pecho: 95, cintura: 82, cadera: 105, muslo: 58, brazo: 30, brazoF: 30.8 },
      { dias: 68, peso: 65.4, grasa: 34.6, visceral: 7, pecho: 94.5, cintura: 81, cadera: 104.5, muslo: 57.5, brazo: 29.8, brazoF: 30.7 }
    ],
    { osea: 2.2, metabolismo: 1180, archivado: true }
  )
)

console.log(`Cargados ${cargados.length} alumnos de ejemplo en ${ruta}:`)
for (const n of cargados) console.log(`  - ${n}`)
db.close()
