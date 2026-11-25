# Datos locales en la PC, preparados para sincronizar más adelante

La v1 la usa solo la Instructora, en su PC y sin login, así que los datos viven en una base SQLite local, sin servidor ni cuentas. Más adelante puede querer usarla también desde el teléfono, y eso exige login y sincronización. Para no rehacer el modelo cuando llegue ese momento, cada registro usa un identificador UUID (no un autoincremental) y guarda la fecha de creación y de última modificación.

## Considered Options

- **Backend en la nube desde el día uno** (Supabase o similar): descartado para la v1 porque suma login, conexión obligatoria y un costo que hoy no hacen falta.
- **Solo local, sin pensar en sync**: descartado porque migrar después de IDs autoincrementales a un modelo sincronizable es caro.
