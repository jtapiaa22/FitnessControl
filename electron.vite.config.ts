import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

const shared = { '@shared': resolve('src/shared') }
const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }

export default defineConfig({
  main: {
    resolve: { alias: shared },
    define: {
      // Solo si el repo pasa a ser privado: token de lectura embebido al compilar
      // (FITNESS_UPDATE_TOKEN=... npm run release). Nunca se commitea. Ver src/main/actualizaciones.ts.
      'process.env.FITNESS_UPDATE_TOKEN': JSON.stringify(process.env.FITNESS_UPDATE_TOKEN ?? '')
    }
  },
  preload: { resolve: { alias: shared } },
  renderer: {
    resolve: { alias: { ...shared, '@renderer': resolve('src/renderer/src') } },
    define: { __VERSION__: JSON.stringify(version) },
    plugins: [react()]
  }
})
