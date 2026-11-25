import { useState } from 'react'
import type { ReporteGuardado } from '@shared/tipos'
import { mensajeDeError } from '../errores'

const IconoWhatsApp = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
  </svg>
)

/** Enviar por WhatsApp, abrir y mostrar en carpeta un Reporte del historial. */
export default function AccionesReporte({ reporte, nombreAlumno, compacto }: { reporte: ReporteGuardado; nombreAlumno: string; compacto?: boolean }) {
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const nombre = nombreAlumno.split(' ')[0]

  const accion = (fn: () => Promise<void>) => async () => {
    setAviso(null)
    try {
      await fn()
    } catch (e) {
      setAviso({ tipo: 'error', texto: mensajeDeError(e) })
    }
  }

  const enviar = accion(async () => {
    const r = await window.api.reporte.enviarPorWhatsApp(reporte.id)
    const donde = r.destino === 'escritorio' ? 'WhatsApp' : 'WhatsApp Web'
    setAviso({
      tipo: 'ok',
      texto: r.conTelefono
        ? `Se abrió ${donde} en el chat de ${nombre}. Pegá el PDF con Ctrl+V y enviá.`
        : `Se abrió ${donde}. ${nombre} no tiene teléfono cargado: elegí su chat, pegá el PDF con Ctrl+V y enviá.`
    })
  })

  const chico = compacto ? ' chico' : ''
  return (
    <div className="acciones-reporte">
      <div className="acciones">
        <button className={`whatsapp${chico}`} onClick={enviar}>
          <IconoWhatsApp />
          Enviar por WhatsApp
        </button>
        <button className={`secundario${chico}`} onClick={accion(() => window.api.reporte.abrir(reporte.id))}>
          Abrir
        </button>
        <button className={`secundario${chico}`} onClick={accion(() => window.api.reporte.mostrarEnCarpeta(reporte.id))}>
          Mostrar en carpeta
        </button>
      </div>
      {aviso && <p className={aviso.tipo === 'error' ? 'error' : 'aviso-ok'}>{aviso.texto}</p>}
    </div>
  )
}
