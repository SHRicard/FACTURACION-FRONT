import type { Paso } from './types';

/**
 * El guion del tour, en orden.
 *
 * ⚠️ ACA se suma un paso cuando sale una pantalla nueva: un objeto mas al final
 * y listo. No hay que tocar el componente, el slice ni el layout.
 *
 * Dos cuidados al agregar:
 * - El `destino` tiene que existir como ruta. Si la pantalla todavia es un
 *   placeholder, mejor esperar: mandar a alguien a una pantalla vacia en el
 *   primer minuto de uso es peor que no mostrar el paso.
 * - No cambies el `id` de un paso viejo. Quien ya lo vio quedo guardado por
 *   indice, y renombrar no rompe nada hoy, pero el id es lo que va a servir el
 *   dia que queramos saber donde abandona la gente.
 */
export const PASOS: readonly Paso[] = [
  {
    id: 'bienvenida',
    titulo: 'Bienvenido',
    texto:
      'Te muestro en cuatro pasos donde esta cada cosa. Podes bajar esta tarjeta cuando quieras y seguir sola.',
    accion: 'Empecemos',
  },
  {
    id: 'facturas',
    titulo: 'Aca viven tus facturas',
    texto:
      'Todo lo que emitis queda listado con su numero y su estado. Es la solapa donde vas a estar la mayor parte del tiempo.',
    tab: 'facturas',
    destino: '/admin/facturas',
    accion: 'Ver Facturas',
  },
  {
    id: 'clientes',
    titulo: 'A quien le facturas',
    texto: 'Carga una vez los datos de cada cliente y despues los elegis de una lista al emitir.',
    tab: 'clientes',
    destino: '/admin/clientes',
    accion: 'Ver Clientes',
  },
  {
    id: 'cuenta',
    titulo: 'Tu cuenta y los ajustes',
    texto:
      'En Mas estan tu perfil, la apariencia de la app y el cierre de sesion. Desde ahi tambien podes volver a ver esta guia.',
    tab: 'cuenta',
    destino: '/admin/cuenta',
    accion: 'Terminar',
  },
];
