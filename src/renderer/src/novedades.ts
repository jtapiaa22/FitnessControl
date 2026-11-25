// Qué cambió en cada versión, para mostrarle a la Instructora en Configuración → Acerca de.
// Al publicar una versión nueva (npm run release), agregá su entrada arriba de todo.
export const NOVEDADES: { version: string; cambios: string[] }[] = [
  {
    version: '0.1.1',
    cambios: [
      'Comparación: figura del cuerpo con cada medida y su cambio, en los dos controles comparados.',
      'Pasá el mouse por una parte del cuerpo para resaltarla, o tocala para ver su detalle y cómo fue cambiando.',
      'El reporte en PDF también muestra la figura con las medidas que elegiste.'
    ]
  },
  {
    version: '0.1.0',
    cambios: [
      'Alumnos, controles con balanza y medidas, y aviso de a quién le toca control.',
      'Comparación entre controles con gráficos y reportes en PDF con tu logo.',
      'Envío del reporte por WhatsApp y copias de seguridad automáticas.',
      'La app se actualiza sola: busca versiones nuevas, las descarga y se instalan al cerrarla.'
    ]
  }
]
