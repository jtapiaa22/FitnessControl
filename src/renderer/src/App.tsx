import { NavLink, Route, Routes } from 'react-router-dom'
import AlumnoForm from './pages/AlumnoForm'
import Alumnos from './pages/Alumnos'
import Comparacion from './pages/Comparacion'
import ControlForm from './pages/ControlForm'
import FichaAlumno from './pages/FichaAlumno'
import Inicio from './pages/Inicio'

export default function App() {
  return (
    <div className="app">
      <aside className="barra">
        <div className="marca">FitnessControl</div>
        <nav>
          <NavLink to="/" end>
            Inicio
          </NavLink>
          <NavLink to="/alumnos">Alumnos</NavLink>
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
          <Route path="/alumnos/:id/controles/nuevo" element={<ControlForm />} />
          <Route path="/alumnos/:id/controles/:controlId" element={<ControlForm />} />
        </Routes>
      </main>
    </div>
  )
}
