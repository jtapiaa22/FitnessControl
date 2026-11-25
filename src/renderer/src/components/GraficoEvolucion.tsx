import { CartesianGrid, LabelList, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatearFecha, formatearNumero } from '@shared/formato'

/** Colores de serie en orden fijo (paleta validada para daltonismo; ver skill dataviz). */
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a'] as const

export interface Serie {
  clave: string
  nombre: string
}

interface Props {
  titulo: string
  unidad: string
  decimales?: number
  /** Un punto por Control, en orden: `n` es el número de Control y `fecha` su fecha. */
  datos: ({ n: number; fecha: string } & Record<string, number | string | null>)[]
  series: Serie[]
  /** Números de los dos Controles comparados, marcados con una línea vertical. */
  marcar?: number[]
}

const TINTA = '#52514e'
const GRILLA = '#e1e0d9'
const EJE = '#c3c2b7'

/** Evolución de una o más series de la misma unidad (nunca dos ejes Y). */
export default function GraficoEvolucion({ titulo, unidad, decimales = 1, datos, series, marcar = [] }: Props) {
  const conDatos = series.filter((s) => datos.some((d) => typeof d[s.clave] === 'number'))
  if (conDatos.length === 0) return null
  const fmt = (v: number) => formatearNumero(v, decimales)
  const ultimoIndice = (clave: string) => datos.findLastIndex((d) => typeof d[clave] === 'number')
  const fechaDe = (n: unknown) => datos.find((d) => d.n === Number(n))?.fecha ?? null

  return (
    <figure className="grafico">
      <figcaption>
        {titulo} <span className="tenue">({unidad})</span>
      </figcaption>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={datos} margin={{ top: 12, right: conDatos.length > 1 ? 120 : 48, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={GRILLA} vertical={false} />
          <XAxis dataKey="n" tickFormatter={(n) => formatearFecha(fechaDe(n)).slice(0, 5)} stroke={EJE} tick={{ fill: TINTA, fontSize: 12 }} tickLine={false} />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={fmt}
            stroke={EJE}
            tick={{ fill: TINTA, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          {marcar.map((n) => (
            <ReferenceLine key={n} x={n} stroke={EJE} />
          ))}
          <Tooltip
            formatter={(v, nombre) => [`${fmt(Number(v))} ${unidad}`, nombre]}
            labelFormatter={(n) => `Control ${n} · ${formatearFecha(fechaDe(n))}`}
            contentStyle={{ borderRadius: 8, borderColor: GRILLA, fontSize: 13 }}
            cursor={{ stroke: EJE }}
          />
          {conDatos.length > 1 && <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: TINTA }}>{v}</span>} />}
          {conDatos.map((s) => {
            const color = SERIES[series.indexOf(s)] ?? SERIES[0]
            const ultimo = ultimoIndice(s.clave)
            return (
              <Line
                key={s.clave}
                type="linear"
                dataKey={s.clave}
                name={s.nombre}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                connectNulls
                isAnimationActive={false}
              >
                {/* Etiqueta directa solo en el último punto, en tinta (no en el color de la serie). */}
                <LabelList
                  dataKey={s.clave}
                  content={({ x, y, value, index }) =>
                    index === ultimo && typeof value === 'number' ? (
                      <text x={Number(x) + 10} y={Number(y)} dy={4} fill={TINTA} fontSize={12}>
                        {conDatos.length > 1 ? `${s.nombre} ${fmt(value)}` : fmt(value)}
                      </text>
                    ) : null
                  }
                />
              </Line>
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  )
}
