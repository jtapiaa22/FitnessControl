# FitnessControl

Seguimiento de la composición corporal y las medidas de los alumnos de una instructora de entrenamiento personalizado, para ver si progresan entre un control y otro.

## Personas

**Instructora**:
La única persona que usa la app. Mide, carga los datos y entrega los reportes.
_Avoid_: Usuario, profesora, admin

**Alumno**:
Persona, mujer o varón, que entrena con la Instructora y a la que se le hace el seguimiento. Es el término genérico, sin importar el género.
_Avoid_: Alumna (como término general), cliente, paciente

**Alumno archivado**:
Alumno que dejó de entrenar. Conserva su historial, pero no aparece en la lista activa ni en los Controles pendientes.
_Avoid_: Inactivo, dado de baja, eliminado

**Objetivo**:
Meta del Alumno con respecto al peso y las Medidas: bajar, subir o mantener. Es un dato de referencia para la Instructora; no cambia cómo se muestran los Cambios.
_Avoid_: Meta, plan

**Frecuencia de control**:
Cada cuántos días se le hace un Control a un Alumno. Es propia de cada Alumno.

**Control pendiente**:
Control que ya tendría que haberse hecho según la Frecuencia de control, contada desde el último Control.
_Avoid_: Vencido

## Mediciones

**Control**:
Una sesión de medición de un Alumno en una fecha, con datos de balanza y de cinta. La frecuencia varía según el Alumno (semanal, quincenal, etc.).
_Avoid_: Medición, sesión, registro, ficha, semana

**Datos de balanza**:
Valores que da la balanza de bioimpedancia en un Control: peso, % grasa, músculo (kg), grasa visceral, masa ósea, % proteína, metabolismo basal y similares.
_Avoid_: Composición, bioimpedancia

**Medidas**:
Perímetros tomados con cinta en un Control, en cm: pecho, cintura, cadera, muslo, brazo relajado y brazo contraído.
_Avoid_: Perímetros, circunferencias

**Ambos lados**:
Opción de un Control para medir el lado izquierdo y el derecho en las Medidas de las extremidades (muslo y brazos). Sin esta opción se mide un solo lado. En una Comparación cada lado se compara siempre contra el mismo lado. Pecho, cintura y cadera llevan un solo valor.

**Brazo contraído**:
Perímetro del brazo mientras el Alumno hace fuerza.
_Avoid_: Brazo en fuerza, brazo flexionado

**Altura**:
Talla del Alumno, cargada una vez y pre-cargada en cada Control. Junto con el peso, da el IMC.

**Masa grasa**:
Grasa corporal expresada en kg (peso × % grasa). Permite compararla con el músculo, que la balanza ya da en kg.

## Comunicación

**Comparación**:
Diferencia entre dos Controles del mismo Alumno. Por defecto compara el último Control con el anterior, pero la Instructora puede elegir cualesquiera dos (por ejemplo, el primero con el octavo).

**Cambio**:
Si un valor subió, bajó o quedó igual entre los dos Controles de una Comparación. Se muestra con color solo para que se vea rápido: no dice si es bueno o malo, eso lo interpreta la Instructora.
_Avoid_: Valoración, mejora, retroceso, progreso

**Reporte**:
PDF detallado, con gráficos, que la Instructora le entrega al Alumno con una Comparación. Ella elige qué datos incluir y puede agregar un texto propio.
_Avoid_: Ficha, informe, planilla

**Nota del reporte**:
Texto libre que la Instructora escribe paral Alumno en un Reporte. Queda guardado con el Control.
_Avoid_: Comentario, observación

**Dato público**:
Valor que el Reporte incluye por defecto: peso, % grasa, masa grasa, músculo, grasa visceral y las Medidas.

**Dato privado**:
Valor que el Reporte no incluye por defecto: % proteína, metabolismo basal y masa ósea.
