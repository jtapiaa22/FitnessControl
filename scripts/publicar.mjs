// Publica el instalador en GitHub Releases (lo usa `npm run release`, después de `npm run build`).
//
// - electron-builder solo lee GH_TOKEN; acá se le pasa el token propio de FitnessControl
//   (GH_TOKEN_FITNESSCONTROL) para no mezclarlo con el de otros proyectos. Si no existe, usa GH_TOKEN.
//   El token necesita permiso "Contents: Read and write" sobre jtapiaa22/FitnessControl.
// - Antes de subir, crea la release vX.Y.Z si no existe: electron-builder sube los archivos en
//   paralelo y, si la release no existe, cada subida intenta crearla y una falla con
//   "Published releases must have a valid tag" (pasó con la v0.1.0).
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const REPO = 'jtapiaa22/FitnessControl'
const token = process.env.GH_TOKEN_FITNESSCONTROL || process.env.GH_TOKEN
if (!token) {
  console.error('Falta el token: definí GH_TOKEN_FITNESSCONTROL (o GH_TOKEN) y abrí una terminal nueva.')
  process.exit(1)
}
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const tag = `v${version}`

const github = (ruta, opciones = {}) =>
  fetch(`https://api.github.com/repos/${REPO}${ruta}`, {
    ...opciones,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'fitnesscontrol-release',
      'X-GitHub-Api-Version': '2022-11-28',
      ...opciones.headers
    }
  })

const existente = await github(`/releases/tags/${tag}`)
if (existente.status === 404) {
  const creada = await github('/releases', {
    method: 'POST',
    body: JSON.stringify({ tag_name: tag, target_commitish: 'main', name: version, body: `FitnessControl ${version}` })
  })
  if (!creada.ok) {
    console.error(`No se pudo crear la release ${tag}: ${creada.status} ${await creada.text()}`)
    process.exit(1)
  }
  console.log(`Release ${tag} creada.`)
} else if (existente.ok) {
  console.log(`La release ${tag} ya existe: se reemplazan sus archivos.`)
} else {
  console.error(`No se pudo consultar GitHub (${existente.status}). ¿El token tiene permiso sobre ${REPO}?`)
  process.exit(1)
}

console.log(`Publicando ${tag} con ${process.env.GH_TOKEN_FITNESSCONTROL ? 'GH_TOKEN_FITNESSCONTROL' : 'GH_TOKEN'}…`)
const resultado = spawnSync('npx', ['electron-builder', '--win', '--x64', '--publish', 'always'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, GH_TOKEN: token }
})
process.exit(resultado.status ?? 1)
