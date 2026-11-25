import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import AcercaDe from '../components/AcercaDe'
import CopiasDeSeguridad from '../components/CopiasDeSeguridad'

const TAMANO_MAXIMO_LOGO = 1_500_000

/** Datos de la Instructora que van en el encabezado del Reporte. */
export default function Configuracion() {
  const [nombre, setNombre] = useState('')
  const [contacto, setContacto] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.configuracion.obtener().then((c) => {
      setNombre(c.nombreInstructora ?? '')
      setContacto(c.contacto ?? '')
      setLogo(c.logo)
    })
  }, [])

  function elegirLogo(e: ChangeEvent<HTMLInputElement>) {
    setError(null)
    const archivo = e.target.files?.[0]
    if (!archivo) return
    if (!['image/png', 'image/jpeg'].includes(archivo.type)) return setError('El logo tiene que ser PNG o JPG.')
    if (archivo.size > TAMANO_MAXIMO_LOGO) return setError('El logo es muy pesado (máximo 1,5 MB).')
    const lector = new FileReader()
    lector.onload = () => setLogo(String(lector.result))
    lector.readAsDataURL(archivo)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setMensaje(null)
    await window.api.configuracion.guardar({ nombreInstructora: nombre.trim() || null, contacto: contacto.trim() || null, logo })
    setMensaje('Guardado.')
  }

  return (
    <section>
      <h1>Configuración</h1>
      <p className="tenue">Estos datos aparecen en el encabezado de los reportes.</p>
      <form onSubmit={guardar} className="formulario" style={{ maxWidth: 880 }}>
        <fieldset>
          <legend>Tus datos</legend>
          <div className="grilla">
            <label className="campo ancho">
              <span className="campo-etiqueta">Nombre (como querés que aparezca)</span>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Prof. Laura Gómez · Entrenamiento personalizado" />
            </label>
            <label className="campo ancho">
              <span className="campo-etiqueta">Contacto (opcional)</span>
              <input value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Ej.: @laura.entrena · 381 555-0000" />
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Logo</legend>
          <div className="logo-config">
            {logo ? <img src={logo} alt="Logo" className="logo-vista" /> : <span className="tenue">Sin logo</span>}
            <div className="acciones">
              <label className="boton secundario">
                Elegir imagen…
                <input type="file" accept="image/png,image/jpeg" onChange={elegirLogo} hidden />
              </label>
              {logo && (
                <button type="button" className="secundario" onClick={() => setLogo(null)}>
                  Quitar
                </button>
              )}
            </div>
          </div>
        </fieldset>
        {error && <p className="error">{error}</p>}
        <div className="acciones">
          <button type="submit">Guardar</button>
          {mensaje && <span className="tenue">{mensaje}</span>}
        </div>
      </form>
      <div style={{ maxWidth: 880, marginTop: '1.5rem' }}>
        <CopiasDeSeguridad />
      </div>
      <div style={{ maxWidth: 880, marginTop: '1.5rem' }}>
        <AcercaDe />
      </div>
    </section>
  )
}
