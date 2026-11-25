# FitnessControl

App de escritorio (Windows) para que una instructora de entrenamiento personalizado registre las mediciones de sus alumnos (balanza y cinta), compare su progreso entre controles y les entregue un reporte en PDF.

Stack: Electron + TypeScript + React + Vite, SQLite local (`better-sqlite3`), Recharts y Vitest. Los requisitos están en [docs/requisitos-iniciales.md](docs/requisitos-iniciales.md) y el vocabulario del dominio en [GLOSSARY.md](GLOSSARY.md).

## Desarrollo

```powershell
npm install
npm run dev
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Abre la app en modo desarrollo |
| `npm test` | Corre los tests (cálculos, comparación, controles pendientes) |
| `npm run typecheck` | Revisa los tipos de TypeScript |
| `npm run demo` | Carga 5 alumnos de ejemplo (con la app cerrada) |
| `npm run demo -- --borrar` | Borra solo los alumnos de ejemplo |
| `npm run instalador` | Genera el instalador de Windows |

## Generar el instalador

```powershell
npm run instalador
```

El instalador queda en `release\<versión>\FitnessControl-Setup-<versión>.exe`, por ejemplo `release\0.1.0\FitnessControl-Setup-0.1.0.exe`. Es el único archivo que hay que pasarle a la instructora.

- Para una versión nueva, subí el número de `"version"` en `package.json` antes de generar el instalador.
- Instalar una versión nueva encima de la anterior **no borra los datos**, y desinstalar tampoco.
- El instalador no está firmado digitalmente. La primera vez, Windows puede mostrar "Windows protegió su PC": se instala con **Más información → Ejecutar de todas formas**.
- El ícono sale de `build/icon.ico` (y `build/icon.png`). Para cambiarlo, reemplazá esos archivos.

## Dónde están los datos

- Base de datos: `%APPDATA%\fitness-control\fitness-control.db` (la misma en desarrollo y en la app instalada).
- Copias de seguridad: al cerrar la app se guarda una copia del día en la carpeta elegida en **Configuración → Copias de seguridad**. Por defecto es `Documentos\FitnessControl\Copias`. Se conservan las últimas 30.
- Restaurar una copia reemplaza todos los datos. Antes de hacerlo, la app guarda los datos actuales en `%APPDATA%\fitness-control\antes-de-restaurar-<fecha>.db`.

## Variables solo para pruebas automáticas

| Variable | Efecto |
|---|---|
| `FITNESS_DATOS` | Usa otra carpeta de datos (para no tocar los datos reales) |
| `FITNESS_PDF_DESTINO` | Guarda el PDF en esa carpeta sin mostrar el diálogo |
| `FITNESS_COPIA_A_RESTAURAR` | Usa ese archivo como copia a restaurar sin mostrar el diálogo |
