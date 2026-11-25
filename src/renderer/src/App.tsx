import { NavLink, Route, Routes } from 'react-router-dom'
import Inicio from './pages/Inicio'
import Alumnos from './pages/Alumnos'

export default function App() {
  return (
    <div className="app">
      <aside className="barra">
        <div className="marca">FitnessControl</div>
        <nav>
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/alumnos">Alumnos</NavLink>
        </nav>
      </aside>
      <main className="contenido">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/alumnos" element={<Alumnos />} />
        </Routes>
      </main>
    </div>
  )
}
