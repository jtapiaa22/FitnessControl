import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './estilos.css'

// Soltar un archivo sobre la ventana haría que Chromium lo abra y reemplace la app:
// se ignora (los archivos se eligen siempre con los botones).
for (const evento of ['dragover', 'drop'] as const) {
  window.addEventListener(evento, (e) => e.preventDefault())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
