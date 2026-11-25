// Qué cambió en cada versión, para mostrarle a la Instructora en Configuración → Acerca de.
// Al publicar una versión nueva (npm run release), agregá su entrada arriba de todo.
export const NOVEDADES: { version: string; cambios: string[] }[] = [
  {
    version: '0.1.1',
    cambios: [
      'La app se actualiza sola: busca versiones nuevas, las descarga y se instalan al cerrarla.',
      'Ahora podés ver acá las novedades de cada versión.'
    ]
  },
  {
    version: '0.1.0',
    cambios: ['Primera versión: alumnos, controles, comparación, reportes en PDF, envío por WhatsApp y copias de seguridad.']
  }
]
