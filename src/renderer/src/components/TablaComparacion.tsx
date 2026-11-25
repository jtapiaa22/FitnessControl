import type { FilaComparacion } from '@shared/comparacion'
import { ETIQUETA_CAMPO } from '@shared/etiquetas'
import { formatearFecha, formatearNumero } from '@shared/formato'
import { DATOS_PUBLICOS, type Control } from '@shared/tipos'

interface Props {
  filas: FilaComparacion[]
  base: Control
  actual: Control
}

const LADO = { izq: ' (izq.)', der: ' (der.)' } as const

/**
 * Tabla "antes / ahora / diferencia". El color de la flecha solo indica si el
 * valor subió o bajó: no juzga si es bueno o malo (ver GLOSSARY.md, "Cambio").
 */
export default function TablaComparacion({ filas, base, actual }: Props) {
  const visibles = filas.filter((f) => f.base !== null || f.actual !== null)
  if (visibles.length === 0) return <p className="tenue">Estos controles no tienen datos para comparar.</p>

  return (
    <table className="tabla comparacion">
      <thead>
        <tr>
          <th>Dato</th>
          <th className="num">{formatearFecha(base.fecha)}</th>
          <th className="num">{formatearFecha(actual.fecha)}</th>
          <th className="num">Diferencia</th>
        </tr>
      </thead>
      <tbody>
        {visibles.map((f) => {
          const { nombre, unidad, decimales } = ETIQUETA_CAMPO[f.campo]
          const valor = (v: number | null) => (v === null ? '—' : `${formatearNumero(v, decimales)} ${unidad}`.trim())
          return (
            <tr key={f.campo + (f.lado ?? '')}>
              <td>
                {nombre}
                {f.lado ? LADO[f.lado] : ''}
                {!DATOS_PUBLICOS.includes(f.campo) && <span className="etiqueta gris privado">solo vos</span>}
              </td>
              <td className="num">{valor(f.base)}</td>
              <td className="num">{valor(f.actual)}</td>
              <td className="num">
                {f.diferencia === null ? (
                  <span className="tenue">—</span>
                ) : (
                  <span className={`cambio ${f.cambio}`}>
                    <span className="flecha" aria-hidden>
                      {f.cambio === 'sube' ? '▲' : f.cambio === 'baja' ? '▼' : '='}
                    </span>
                    {f.diferencia > 0 ? '+' : ''}
                    {formatearNumero(f.diferencia, decimales)} {unidad}
                  </span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
