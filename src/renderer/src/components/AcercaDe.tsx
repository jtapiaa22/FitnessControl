import icono from '../assets/icono.png'

/** Créditos de la app en Configuración. */
export default function AcercaDe() {
  return (
    <fieldset>
      <legend>Acerca de</legend>
      <div className="acerca">
        <img src={icono} alt="" className="acerca-icono" />
        <div>
          <div className="acerca-nombre">FitnessControl</div>
          <div className="tenue">Versión {__VERSION__}</div>
          <div className="acerca-autor">
            Desarrollado por <strong>TADevStudio</strong>
          </div>
          <div className="tenue">© {new Date().getFullYear()} TADevStudio. Todos los derechos reservados.</div>
        </div>
      </div>
    </fieldset>
  )
}
