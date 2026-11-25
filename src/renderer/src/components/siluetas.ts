// Figura del cuerpo (vista de frente) para ubicar las Medidas. Es una ilustración anatómica
// única para todos los Alumnos (build/siluetas/silueta-anatomica.jpg, recortada a fondo
// transparente en assets/silueta.png).
//
// Las coordenadas están en el cuadro de la figura: 256,7 × 510 (la imagen escalada a 510 de
// alto). Se tomaron midiendo el ancho del cuerpo a cada altura sobre la imagen recortada
// (540 × 1073 px, factor 510 / 1073).
import type { Sexo } from '@shared/tipos'
import imagen from '../assets/silueta.png'

type Punto = [number, number]
type Elipse = { cx: number; cy: number; rx: number; ry: number }

/** Dónde se toma cada Medida. */
export type ZonaMedida = 'pecho' | 'cintura' | 'cadera' | 'brazoIzq' | 'brazoDer' | 'musloIzq' | 'musloDer'

export interface Silueta {
  imagen: string
  ancho: number
  alto: number
  /** Punto del cuerpo al que llega la línea de cada Medida. */
  anclas: Record<ZonaMedida, Punto>
  /** Área de cada zona en el cuerpo: se resalta al pasar el mouse y se puede tocar. */
  areas: Record<ZonaMedida, Elipse>
}

const ANATOMICA: Silueta = {
  imagen,
  ancho: 256.7,
  alto: 510,
  // Vista de frente: el lado derecho del Alumno queda a la izquierda de la pantalla.
  anclas: {
    pecho: [102, 121], // pectoral
    brazoDer: [54, 178], // bíceps
    brazoIzq: [202, 178],
    cintura: [170, 209], // lo más angosto del abdomen, a la altura del ombligo
    cadera: [175, 257], // lo más ancho de la pelvis
    musloDer: [86, 309], // mitad del cuádriceps
    musloIzq: [171, 309]
  },
  areas: {
    pecho: { cx: 128, cy: 121, rx: 40, ry: 17 },
    brazoDer: { cx: 54, cy: 171, rx: 18, ry: 36 },
    brazoIzq: { cx: 202, cy: 171, rx: 18, ry: 36 },
    cintura: { cx: 128, cy: 209, rx: 38, ry: 10 },
    cadera: { cx: 128, cy: 257, rx: 44, ry: 11 },
    musloDer: { cx: 105, cy: 309, rx: 20, ry: 29 },
    musloIzq: { cx: 150, cy: 309, rx: 20, ry: 29 }
  }
}

/** Por ahora una sola figura para todos; queda el parámetro por si se suman otras. */
export const siluetaPara = (_sexo: Sexo | null): Silueta => ANATOMICA
