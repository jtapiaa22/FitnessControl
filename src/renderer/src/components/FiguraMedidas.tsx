import type { KeyboardEvent } from 'react'
import type { FilaComparacion } from '@shared/comparacion'
import { formatearNumero } from '@shared/formato'
import type { CampoReporte, Control, Sexo } from '@shared/tipos'
import { siluetaPara, type ZonaMedida } from './siluetas'

/** Interacción en pantalla: la zona resaltada y la elegida se comparten entre las dos siluetas. */
export interface InteraccionFigura {
  resaltada: ZonaMedida | null
  elegida: ZonaMedida | null
  alResaltar: (zona: ZonaMedida | null) => void
  alElegir: (zona: ZonaMedida) => void
}

interface Props {
  titulo: string
  control: Control
  sexo: Sexo | null
  /** Filas de la Comparación: si se pasan, se muestra la diferencia de cada Medida. */
  filas?: FilaComparacion[]
  /** Si se pasa, solo se muestran estas Medidas (las elegidas para el Reporte). */
  campos?: readonly CampoReporte[]
  /** Para el PDF: letras más grandes (la figura se imprime más chica) y textos abreviados. */
  paraImprimir?: boolean
  /** Si se pasa, las zonas del cuerpo responden al mouse, al clic y al teclado. */
  interaccion?: InteraccionFigura
}

type Lado = 'izq' | 'der'

interface Etiqueta {
  zona: ZonaMedida
  nombre: string
  columna: 'izquierda' | 'derecha'
  /** Altura de la etiqueta en el dibujo (se ajusta para que no se pisen). */
  y: number
  valores: { texto?: string; campo: CampoReporte; lado?: Lado; valor: number | null }[]
}

const ANCHO = 600
const ALTO = 530
const X_FIGURA = 172 // la figura ocupa de 172 a ~429; las etiquetas, 168 a cada lado

const cm = (v: number) => `${formatearNumero(v, 1)} cm`

/** Nombre de cada zona, para títulos y lectores de pantalla. */
export const NOMBRE_ZONA: Record<ZonaMedida, string> = {
  pecho: 'Pecho',
  cintura: 'Cintura',
  cadera: 'Cadera',
  brazoIzq: 'Brazo izquierdo',
  brazoDer: 'Brazo derecho',
  musloIzq: 'Muslo izquierdo',
  musloDer: 'Muslo derecho'
}

function etiquetas(c: Control, abreviar: boolean): Etiqueta[] {
  const rel = abreviar ? 'rel.' : 'relajado'
  const contr = abreviar ? 'contr.' : 'contraído'
  // Vista de frente: el lado derecho del Alumno queda a la izquierda de la pantalla.
  return [
    { zona: 'pecho', nombre: 'Pecho', columna: 'izquierda', y: 112, valores: [{ campo: 'pecho', valor: c.pechoCm }] },
    {
      zona: 'brazoDer',
      nombre: 'Brazo der.',
      columna: 'izquierda',
      y: 190,
      valores: [
        { texto: rel, campo: 'brazoRelajado', lado: 'der', valor: c.brazoRelajadoDerCm },
        { texto: contr, campo: 'brazoContraido', lado: 'der', valor: c.brazoContraidoDerCm }
      ]
    },
    { zona: 'musloDer', nombre: 'Muslo der.', columna: 'izquierda', y: 320, valores: [{ campo: 'muslo', lado: 'der', valor: c.musloDerCm }] },
    {
      zona: 'brazoIzq',
      nombre: 'Brazo izq.',
      columna: 'derecha',
      y: 128,
      valores: [
        { texto: rel, campo: 'brazoRelajado', lado: 'izq', valor: c.brazoRelajadoIzqCm },
        { texto: contr, campo: 'brazoContraido', lado: 'izq', valor: c.brazoContraidoIzqCm }
      ]
    },
    { zona: 'cintura', nombre: 'Cintura', columna: 'derecha', y: 215, valores: [{ campo: 'cintura', valor: c.cinturaCm }] },
    { zona: 'cadera', nombre: 'Cadera', columna: 'derecha', y: 268, valores: [{ campo: 'cadera', valor: c.caderaCm }] },
    { zona: 'musloIzq', nombre: 'Muslo izq.', columna: 'derecha', y: 330, valores: [{ campo: 'muslo', lado: 'izq', valor: c.musloIzqCm }] }
  ]
}

function diferencia(filas: FilaComparacion[] | undefined, campo: CampoReporte, lado?: Lado): FilaComparacion | null {
  const f = filas?.find((x) => x.campo === campo && x.lado === lado)
  return f && f.diferencia !== null ? f : null
}

/** Silueta con una línea a cada zona medida y su valor (y la diferencia, si se compara). */
export default function FiguraMedidas({ titulo, control, sexo, filas, campos, paraImprimir, interaccion }: Props) {
  const silueta = siluetaPara(sexo)
  // Solo las Medidas elegidas y con valor en este Control.
  const lista = etiquetas(control, !!paraImprimir)
    .map((e) => ({ ...e, valores: e.valores.filter((v) => v.valor !== null && (!campos || campos.includes(v.campo))) }))
    .filter((e) => e.valores.length > 0)
  // En el PDF la figura se imprime a ~60 %: letras y separaciones más grandes para que se lean.
  const k = paraImprimir ? 1.18 : 1
  const paso = (filas ? 38 : 21) * k
  // Cada etiqueta ocupa desde su nombre (arriba) hasta su último valor o diferencia (abajo).
  // Si en su columna se pisaría con la de arriba, se corre hacia abajo lo justo.
  const arriba = 28 * k
  const abajo = (n: number) => 8 * k + (n - 1) * paso + (filas ? 17 * k : 0) + 6
  for (const columna of ['izquierda', 'derecha'] as const) {
    let limite = -Infinity
    for (const e of lista.filter((x) => x.columna === columna).sort((a, b) => a.y - b.y)) {
      e.y = Math.max(e.y, limite + arriba)
      limite = e.y + abajo(e.valores.length)
    }
  }

  const estado = (zona: ZonaMedida) =>
    interaccion ? `${interaccion.resaltada === zona ? ' resaltada' : ''}${interaccion.elegida === zona ? ' elegida' : ''}` : ''
  // Props comunes a todo lo que se puede tocar de una zona (área del cuerpo y etiqueta).
  const tocable = (zona: ZonaMedida) =>
    interaccion
      ? {
          onPointerEnter: () => interaccion.alResaltar(zona),
          onPointerLeave: () => interaccion.alResaltar(null),
          onClick: () => interaccion.alElegir(zona)
        }
      : {}

  return (
    <figure className={`figura-medidas${paraImprimir ? ' imprimir' : ''}${interaccion ? ' interactiva' : ''}`}>
      <figcaption>{titulo}</figcaption>
      {lista.length === 0 ? (
        <p className="tenue">Este control no tiene medidas con cinta.</p>
      ) : (
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role={interaccion ? 'group' : 'img'} aria-label={`Medidas de ${titulo}`}>
          <g transform={`translate(${X_FIGURA} 8)`}>
            <image href={silueta.imagen} x={0} y={0} width={silueta.ancho} height={silueta.alto} />
            {/* Zonas que se resaltan y se pueden tocar: solo en pantalla, nunca en el PDF. */}
            {interaccion &&
              lista.map((e) => (
                <ellipse key={e.zona} data-zona={e.zona} {...silueta.areas[e.zona]} className={`area${estado(e.zona)}`} {...tocable(e.zona)} />
              ))}
          </g>
          {lista.map((e) => {
            const [ax, ay] = silueta.anclas[e.zona]
            const x = ax + X_FIGURA
            const y = ay + 8
            const izquierda = e.columna === 'izquierda'
            const borde = izquierda ? 168 : ANCHO - 168
            const textoX = izquierda ? borde - 8 : borde + 8
            const ancla = izquierda ? 'end' : 'start'
            const alto = abajo(e.valores.length) + arriba
            const teclado = interaccion
              ? {
                  tabIndex: 0,
                  role: 'button',
                  'aria-label': `${NOMBRE_ZONA[e.zona]}: ver el detalle`,
                  'aria-pressed': interaccion.elegida === e.zona,
                  onFocus: () => interaccion.alResaltar(e.zona),
                  onBlur: () => interaccion.alResaltar(null),
                  onKeyDown: (ev: KeyboardEvent) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault()
                      interaccion.alElegir(e.zona)
                    }
                  }
                }
              : {}
            return (
              <g key={e.zona} data-zona={e.zona} className={`zona${estado(e.zona)}`} {...tocable(e.zona)} {...teclado}>
                {/* Área invisible detrás del texto: hace fácil apuntarle a la etiqueta. */}
                {interaccion && (
                  <rect x={izquierda ? 0 : borde} y={e.y - arriba} width={168} height={alto} className="area-etiqueta" />
                )}
                <line x1={x} y1={y} x2={borde} y2={e.y} className="guia" />
                <circle cx={x} cy={y} r={3.5} className="punto" />
                <g className={`textos ${izquierda ? 'a-la-izquierda' : 'a-la-derecha'}`}>
                  <text x={textoX} y={e.y - 12 * k} textAnchor={ancla} className="medida-nombre">
                    {e.nombre}
                  </text>
                  {e.valores.map((v, i) => {
                    const dif = diferencia(filas, v.campo, v.lado)
                    const fila = e.y + 8 * k + i * paso
                    return (
                      <g key={v.campo}>
                        <text x={textoX} y={fila} textAnchor={ancla} className="medida-valor">
                          {cm(v.valor!)}
                          {v.texto && <tspan className="medida-detalle"> {v.texto}</tspan>}
                        </text>
                        {dif && (
                          <text x={textoX} y={fila + 17 * k} textAnchor={ancla} className={`medida-dif ${dif.cambio}`}>
                            <tspan className="flecha">{dif.cambio === 'sube' ? '▲' : dif.cambio === 'baja' ? '▼' : '='} </tspan>
                            {dif.diferencia! > 0 ? '+' : ''}
                            {cm(dif.diferencia!)}
                          </text>
                        )}
                      </g>
                    )
                  })}
                </g>
              </g>
            )
          })}
        </svg>
      )}
    </figure>
  )
}
