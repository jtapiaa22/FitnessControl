import { NavLink, Route, Routes } from 'react-router-dom'
import AlumnoForm from './pages/AlumnoForm'
import Alumnos from './pages/Alumnos'
import Comparacion from './pages/Comparacion'
import Configuracion from './pages/Configuracion'
import ControlForm from './pages/ControlForm'
import FichaAlumno from './pages/FichaAlumno'
import Inicio from './pages/Inicio'
import Reporte from './pages/Reporte'

// Íconos de línea simples, al estilo de los símbolos del sistema.
const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const IconoInicio = () => (
  <svg viewBox="0 0 24 24" {...trazo} aria-hidden>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </svg>
)
const IconoAlumnos = () => (
  <svg viewBox="0 0 24 24" {...trazo} aria-hidden>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M16.5 14.6c2.6.2 4.4 1.9 5 4.9" />
  </svg>
)
const IconoConfiguracion = () => (
  <svg viewBox="0 0 24 24" {...trazo} aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
)
const IconoMarca = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...trazo} strokeWidth={2.2} aria-hidden>
    <path d="M3 12h3l3-7 4 14 3-7h5" />
  </svg>
)

export default function App() {
  return (
    <div className="app">
      <aside className="barra">
        <div className="marca">
          <span className="marca-icono">
            <IconoMarca />
          </span>
          <span className="marca-texto">FitnessControl</span>
        </div>
        <nav>
          <NavLink to="/" end title="Pendientes">
            <IconoInicio />
            <span>Pendientes</span>
          </NavLink>
          <NavLink to="/alumnos" title="Alumnos">
            <IconoAlumnos />
            <span>Alumnos</span>
          </NavLink>
          <NavLink to="/configuracion" title="Configuración">
            <IconoConfiguracion />
            <span>Configuración</span>
          </NavLink>
        </nav>
      </aside>
      <main className="contenido">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/alumnos" element={<Alumnos />} />
          <Route path="/alumnos/nuevo" element={<AlumnoForm />} />
          <Route path="/alumnos/:id" element={<FichaAlumno />} />
          <Route path="/alumnos/:id/editar" element={<AlumnoForm />} />
          <Route path="/alumnos/:id/comparar" element={<Comparacion />} />
          <Route path="/alumnos/:id/reporte" element={<Reporte />} />
          <Route path="/alumnos/:id/controles/nuevo" element={<ControlForm />} />
          <Route path="/alumnos/:id/controles/:controlId" element={<ControlForm />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Routes>
      </main>
    </div>
  )
}
