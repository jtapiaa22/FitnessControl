# Requisitos iniciales: FitnessControl

> **Terminología:** la Instructora entrena tanto a mujeres como a varones, así que el término del dominio es **Alumno** (genérico). Las citas del audio conservan "alumnas".

Fuente: audio de WhatsApp de la instructora (24/11/2026), transcripto el 25/11/2026.

## Contexto
- Es instructora de gimnasio y da clases personalizadas a alumnos (mujeres y varones).
- Hoy completa una ficha en Excel y le manda al alumno una **foto** de esa ficha.
- Quiere algo digital y **más formal** para pasarle al alumno.

## Datos que comparte con el alumno
| Dato | Unidad | Origen |
|---|---|---|
| Peso general | kg | Balanza |
| Masa muscular | kg | Balanza |
| Grasa corporal | % | Balanza |
| Grasa visceral | (índice de la balanza) | Balanza |
| Pecho | cm | Cinta |
| Cintura | cm | Cinta |
| Cadera | cm | Cinta |
| Muslo | cm | Cinta |
| Brazo relajado | cm | Cinta |
| Brazo contraído (haciendo fuerza) | cm | Cinta |

Lo que más le importa es **comparar** las mediciones entre fechas: masa muscular contra grasa, y las medidas.

## Datos que guarda solo para ella (no se los pasa al alumno)
- % de proteína
- Metabolismo basal
- Otros valores que da la balanza

## Ficha Excel actual (`ORIGINAL - real.xlsm`), revisada el 25/11/2026
- **Datos**: formulario de carga con fecha, peso, altura, IMC (calculado), grasa, grasa visceral, músculo, masa ósea, proteína, metabolismo basal, cintura, cadera, pecho, muslo y brazo.
- **Macro `CopiarDatos`**: copia el formulario a la siguiente fila libre de `Base_de_Datos` ("Datos guardados correctamente!").
- **Base_de_Datos**: una fila por control (tabla `Tabla1`, columnas A–O). Un archivo por alumno.
- **Balance**: Control 1 a 7 con peso, grasa, músculo y fecha, más 4 gráficos de barras (Peso, Grasa, Músculo, General).

### Problemas encontrados en las fórmulas
1. **IMC**: `peso / (altura²)` está bien solo si la altura se carga en **metros** (1,65). Si se carga en cm (165), da un valor absurdo. Nada lo controla.
2. **Probablemente se saltea el primer control**: la tabla empieza en la fila 3, pero `Balance` lee desde la fila 4 (`Control 1 = Base_de_Datos!B4`). Si la macro escribe el primer control en la fila 3, ese control no aparece en el balance ni en los gráficos.
3. **Tope de 7 controles**: el balance y los gráficos solo cubren 7 filas.
4. **El gráfico "General" mezcla unidades**: peso (kg), grasa (%) y músculo (kg) en el mismo eje. Comparar 30 % de grasa con 25 kg de músculo no tiene sentido. Es justo lo que mencionó ella. Solución: grasa en kg = peso × % grasa / 100.
5. **Un solo campo de brazo**: ella necesita brazo relajado y brazo contraído.
6. **Nombres definidos rotos** (`#REF!`): ALUMNOS, DNI, TELEFONO, FECHA_DE_NAC., ACTIVIDAD, COMBO, PRECIO, MODO_DE_PAGO, DESDE, HASTA, VENCIMIENTO. Son restos de una hoja borrada, probablemente de gestión de alumnos y pagos. Puede ser una funcionalidad futura.

### Cálculos derivados recomendados para la app
- IMC = peso (kg) / altura (m)², validando que la altura esté entre 1,0 y 2,3 m (o convirtiendo desde cm).
- Masa grasa (kg) = peso × % grasa / 100.
- Masa magra (kg) = peso − masa grasa.
- % músculo = músculo (kg) / peso × 100, para comparar en la misma unidad que la grasa.
- Índice cintura/cadera = cintura / cadera.
- Diferencias de cada valor contra el control anterior y contra el primero.

## Decisiones v1 (grill del 25/11/2026)
Los términos están definidos en `GLOSSARY.md`.

**Alcance**
- Solo control físico. Pagos, cuotas, agenda y fotos de progreso quedan fuera.
- Una sola usuaria, en su PC, sin login. Los datos son locales (SQLite), preparados para sincronizar más adelante (ADR 0001).
- Sin importador de los Excel viejos.

**Alumno**
- Datos: nombre (obligatorio), teléfono, fecha de nacimiento, sexo, notas, altura, Objetivo (bajar, subir o mantener) y Frecuencia de control (7 días por defecto).
- Se archiva en vez de borrarse. El borrado definitivo pide doble confirmación.

**Control**
- Solo la fecha es obligatoria.
- Datos de balanza: peso, % grasa, músculo (kg), grasa visceral, masa ósea, % proteína y metabolismo basal. No se carga agua ni tipo de cuerpo.
- Medidas en cm: pecho, cintura, cadera, muslo, brazo relajado y brazo contraído. Con el check "Ambos lados" (por Control), muslo y brazos llevan valor izquierdo y derecho; si no, se mide un solo lado (izquierdo o derecho). Siempre se compara lado contra lado, y solo los lados medidos en los dos Controles (un lado contra ambos → ese lado; ambos contra ambos → los dos).
- Altura pre-cargada desde el Alumno, editable, con selector cm/m. Se guarda en metros.
- Cálculos: IMC (peso / altura²), masa grasa, masa magra, % músculo e índice cintura/cadera.
- Avisos amarillos que no bloquean, para valores fuera de rango o saltos grandes contra el Control anterior.

**Pantalla de inicio**
- Lista de Controles pendientes, según la Frecuencia de control de cada Alumno.

**Comparación y Reporte**
- Por defecto compara el último Control con el anterior. Se pueden elegir dos Controles cualesquiera.
- El Reporte es un PDF con encabezado de la Instructora (nombre, logo y contacto opcional), datos del Alumno, una tabla con los dos Controles y la diferencia, gráficos de evolución y la Nota del reporte.
- Casillas para elegir qué datos van: la primera vez se marcan los Datos públicos, y después se recuerda la última selección de cada Alumno.
- Colores de las diferencias: solo muestran si el valor subió, bajó o quedó igual, sin juzgar si es bueno o malo (lo interpreta la Instructora). Los colores exactos los define ella más adelante. *(Cambio del 25/11/2026: reemplaza los colores según el Objetivo.)*
- Los PDF no se guardan en la app. La Nota del reporte sí se guarda con el Control.

**Backup**
- Copia automática al cerrar la app, una por día, en una carpeta elegible (por ejemplo, Google Drive). Por defecto: Documentos\FitnessControl\Copias. Se conservan las últimas 30.
- Restaurar reemplaza todos los datos, previa confirmación, y guarda antes una copia de los datos actuales.

**Stack**
- Electron, TypeScript, React, Vite, better-sqlite3, Recharts y Vitest.
- El PDF se genera con el `printToPDF` de Electron.
- Instalador .exe con electron-builder. Las actualizaciones de la v1 son manuales.

## Implicancias para el diseño
- Cada medición tiene campos **públicos** (van al reporte del alumno) y **privados** (solo los ve la instructora).
- La masa muscular está en kg y la grasa en %: para compararlas conviene mostrar también la grasa en kg (peso × %).
- El entregable clave es un **reporte con buena presentación** (PDF o imagen) con la comparación, que reemplace la foto del Excel.
