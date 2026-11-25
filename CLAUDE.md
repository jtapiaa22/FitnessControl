# FitnessControl

Desktop app (Electron + TypeScript) for a personal-training instructor: record each student's measurements (scale + tape), compare them over time, and produce a formal report for the student. Requirements: `docs/requisitos-iniciales.md`. User-facing text is in Spanish (Argentina).

## Comandos

- `npm run dev`: app en modo desarrollo
- `npm run typecheck` / `npm test` / `npm run build`
- `npm run instalador`: instalador de Windows en `release/<versión>/` (config en `electron-builder.yml`, ícono en `build/`)
- `npm run demo` / `npm run demo -- --borrar`: alumnos de ejemplo marcados `(alumno de ejemplo)` en las notas (con la app cerrada)
- Pruebas automáticas sin tocar datos reales: `FITNESS_DATOS`, `FITNESS_PDF_DESTINO`, `FITNESS_COPIA_A_RESTAURAR` (ver README)
- La base vive en `%APPDATA%\fitness-control\fitness-control.db` (forzado con `app.setPath`, igual en dev e instalada) y solo la abre el proceso main.
- Copias de seguridad: `src/main/backup.ts` (copia al cerrar, últimas 30, restaurar guardando antes la base actual).
- `better-sqlite3` necesita sus install scripts aprobados (`allowScripts` en package.json). Electron baja su binario con `node node_modules/electron/install.js` si falta `node_modules/electron/dist`.

## Estructura

- `src/shared/`: tipos de dominio, API del preload y cálculos puros (testeables con Vitest, sin DB).
- `src/main/`: proceso principal, backup, PDF, SQLite (`db/esquema.ts` con migraciones por `user_version`) e IPC.
- `src/preload/`: expone `window.api` (contextIsolation activado).
- `src/renderer/`: React + react-router (HashRouter).

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root, created lazily. See `docs/agents/domain.md`.
