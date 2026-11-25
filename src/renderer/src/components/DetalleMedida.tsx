import { useEffect, useRef } from 'react'
import { formatearFecha, formatearNumero } from '@shared/formato'
import type { Control } from '@shared/tipos'
import { NOMBRE_ZONA } from './FiguraMedidas'
import GraficoEvolucion from './GraficoEvolucion'
import type { ZonaMedida } from './siluetas'

type Medida = { clave: string; nombre: string; valor: (c: Control) => number | null }

/** Qué valores tiene cada zona del cuerpo (siempre comparados del mismo lado). */
const MEDIDAS_DE_ZONA: Record<ZonaMedida, Medida[]> = {
  pecho: [{ clave: 'v0', nombre: 'Pecho', valor: (c) => c.pechoCm }],
  cintura: [{ clave: 'v0', nombre: 'Cintura', valor: (c) => c.cinturaCm }],
  cadera: [{ clave: 'v0', nombre: 'Cadera', valor: (c) => c.caderaCm }],
  brazoIzq: [
    { clave: 'v0', nombre: 'Relajado', valor: (c) => c.brazoRelajadoIzqCm },
    { clave: 'v1', nombre: 'Contraído', valor: (c) => c.brazoContraidoIzqCm }
  ],
  brazoDer: [
    { clave: 'v0', nombre: 'Relajado', valor: (c) => c.brazoRelajadoDerCm },
    { clave: 'v1', nombre: 'Contraído', valor: (c) => c.brazoContraidoDerCm }
  ],
  musloIzq: [{ clave: 'v0', nombre: 'Muslo izquierdo', valor: (c) => c.musloIzqCm }],
  musloDer: [{ clave: 'v0', nombre: 'Muslo derecho', valor: (c) => c.musloDerCm }]
}

const cm = (v: number) => `${formatearNumero(v, 1)} cm`

function Cambio({ desde, hasta }: { desde: number | null; hasta: number | null }) {
  if (desde === null || hasta === null) return <span className="tenue">—</span>
  const d = Math.round((hasta - desde) * 100) / 100
  const tipo = d > 0 ? 'sube' : d < 0 ? 'baja' : 'igual'
  return (
    <span className={`cambio ${tipo}`}>
      <span className="flecha" aria-hidden>
        {tipo === 'sube' ? '▲' : tipo === 'baja' ? '▼' : '='}
      </span>
      {d > 0 ? '+' : ''}
      {cm(d)}
    </span>
  )
}

interface Props {
  zona: ZonaMedida
  controles: Control[]
  indiceBase: number
  indiceActual: number
  alCerrar: () => void
}

/** Detalle de una zona del cuerpo: los dos controles comparados, el cambio total y su evolución. */
export default function DetalleMedida({ zona, controles, indiceBase, indiceActual, alCerrar }: Props) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ref.current?.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'nearest' })
  }, [zona])

  const medidas = MEDIDAS_DE_ZONA[zona].filter((m) => controles.some((c) => m.valor(c) !== null))
  const base = controles[indiceBase]!
  const actual = controles[indiceActual]!
  const datos = controles.map((c, i) => ({ n: i + 1, fecha: c.fecha, ...Object.fromEntries(medidas.map((m) => [m.clave, m.valor(c)])) }))

  return (
    <section ref={ref} className="detalle-medida" aria-live="polite">
      <div className="encabezado">
        <h3>{NOMBRE_ZONA[zona]}</h3>
        <button className="secundario chico" onClick={alCerrar}>
          Cerrar
        </button>
      </div>
      {medidas.length === 0 ? (
        <p className="tenue">Esta zona no tiene medidas cargadas.</p>
      ) : (
        <div className="detalle-cuerpo">
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th></th>
                  <th className="num">Control {indiceBase + 1}</th>
                  <th className="num">Control {indiceActual + 1}</th>
                  <th className="num">Cambio</th>
                  <th className="num">Desde el primero</th>
                </tr>
              </thead>
              <tbody>
                {medidas.map((m) => {
                  // El primer Control que tiene esta medida (del mismo lado).
                  const primero = controles.find((c) => m.valor(c) !== null) ?? null
                  return (
                    <tr key={m.clave}>
                      <td>{m.nombre}</td>
                      <td className="num">{m.valor(base) === null ? '—' : cm(m.valor(base)!)}</td>
                      <td className="num">{m.valor(actual) === null ? '—' : cm(m.valor(actual)!)}</td>
                      <td className="num">
                        <Cambio desde={m.valor(base)} hasta={m.valor(actual)} />
                      </td>
                      <td className="num" title={primero ? `Desde el ${formatearFecha(primero.fecha)}` : undefined}>
                        <Cambio desde={primero ? m.valor(primero) : null} hasta={m.valor(actual)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <GraficoEvolucion
            titulo={`Evolución · ${NOMBRE_ZONA[zona].toLowerCase()}`}
            unidad="cm"
            datos={datos}
            series={medidas.map((m) => ({ clave: m.clave, nombre: m.nombre }))}
            marcar={[indiceBase + 1, indiceActual + 1]}
            alto={240}
          />
        </div>
      )}
    </section>
  )
}
