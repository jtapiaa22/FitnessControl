# FitnessControl

Desktop app (Electron + TypeScript) for a personal-training instructor: record each student's measurements (scale + tape), compare them over time, and produce a formal report for the student. Requirements: `docs/requisitos-iniciales.md`. User-facing text is in Spanish (Argentina).

## Comandos

- `npm run dev`: app en modo desarrollo
- `npm run typecheck` / `npm test` / `npm run build`
- La base vive en `%APPDATA%\fitness-control\fitness-control.db` y solo la abre el proceso main.
- `better-sqlite3` necesita sus install scripts aprobados (`allowScripts` en package.json). Electron baja su binario con `node node_modules/electron/install.js` si falta `node_modules/electron/dist`.

## Estructura

- `src/shared/`: tipos de dominio, API del preload y cálculos puros (testeables con Vitest, sin DB).
- `src/main/`: proceso principal, SQLite (`db/esquema.ts` con migraciones por `user_version`) e IPC.
- `src/preload/`: expone `window.api` (contextIsolation activado).
- `src/renderer/`: React + react-router (HashRouter).

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root, created lazily. See `docs/agents/domain.md`.
