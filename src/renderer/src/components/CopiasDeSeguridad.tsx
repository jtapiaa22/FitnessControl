import { useCallback, useEffect, useState } from 'react'
import { mensajeDeError } from '../errores'

/** Copias de seguridad: carpeta, última copia, copia manual y restaurar. */
export default function CopiasDeSeguridad() {
  const [carpeta, setCarpeta] = useState('')
  const [ultima, setUltima] = useState<string | null>(null)
  const [errorCopia, setErrorCopia] = useState<string | null>(null)
  const [estado, setEstado] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const cargar = useCallback(async () => {
    const [c, cfg] = await Promise.all([window.api.backup.carpeta(), window.api.configuracion.obtener()])
    setCarpeta(c)
    setUltima(cfg.ultimoBackup)
    setErrorCopia(cfg.errorBackup)
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function accion(fn: () => Promise<void>) {
    setOcupado(true)
    setEstado(null)
    try {
      await fn()
    } catch (e) {
      setEstado({ tipo: 'error', texto: mensajeDeError(e) })
    } finally {
      setOcupado(false)
      await cargar()
    }
  }

  const cambiarCarpeta = () =>
    accion(async () => {
      const nueva = await window.api.backup.elegirCarpeta()
      if (nueva) setEstado({ tipo: 'ok', texto: 'Carpeta cambiada. La próxima copia se guarda ahí.' })
    })

  const copiarAhora = () =>
    accion(async () => {
      await window.api.backup.hacerCopia()
      setEstado({ tipo: 'ok', texto: 'Copia guardada.' })
    })

  const restaurar = () =>
    accion(async () => {
      const copia = await window.api.backup.elegirCopia()
      if (!copia) return
      const ok = confirm(
        `Esta copia tiene ${copia.alumnos} alumnos y ${copia.controles} controles.\n\n` +
          'Restaurarla REEMPLAZA todos los datos actuales de la app. Antes de reemplazarlos se guarda una copia de los datos actuales, por si hace falta volver atrás.\n\n' +
          '¿Restaurar y reiniciar la app?'
      )
      if (ok) await window.api.backup.restaurar(copia.ruta)
    })

  return (
    <fieldset>
      <legend>Copias de seguridad</legend>
      <p className="tenue" style={{ marginTop: 0 }}>
        Cada vez que cerrás la app se guarda una copia de todos tus datos (se conservan las últimas 30). Si elegís una carpeta de Google
        Drive o OneDrive, las copias quedan también en la nube.
      </p>
      <div className="datos">
        <div className="dato ancho">
          <span className="dato-etiqueta">Carpeta</span>
          <span className="ruta">{carpeta}</span>
        </div>
        <div className="dato">
          <span className="dato-etiqueta">Última copia</span>
          <span>{ultima ? new Date(ultima).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : 'Todavía ninguna'}</span>
        </div>
      </div>
      {errorCopia && <p className="error">La última copia falló: {errorCopia}</p>}
      <div className="acciones" style={{ marginTop: '1.25rem' }}>
        <button type="button" onClick={copiarAhora} disabled={ocupado}>
          Hacer copia ahora
        </button>
        <button type="button" className="secundario" onClick={cambiarCarpeta} disabled={ocupado}>
          Cambiar carpeta…
        </button>
        <button type="button" className="secundario" onClick={() => window.api.backup.abrirCarpeta()} disabled={ocupado}>
          Abrir carpeta
        </button>
        <button type="button" className="peligro derecha" onClick={restaurar} disabled={ocupado}>
          Restaurar una copia…
        </button>
      </div>
      {estado && <p className={estado.tipo === 'error' ? 'error' : 'tenue'}>{estado.texto}</p>}
    </fieldset>
  )
}
