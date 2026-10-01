import type { Href } from 'expo-router';

import type { RutaLegal } from './types';

/**
 * Donde vive cada documento dentro de la app.
 *
 * Es la UNICA fuente de verdad de estos links: los usan la casilla del registro,
 * la pantalla de aceptacion y la seccion Legal del perfil. Google pide que los
 * dos primeros (terminos y privacidad) esten a la vista en el alta y tambien
 * accesibles desde adentro de la app, no escondidos en un menu.
 *
 * Las rutas quedan FUERA de `/admin` a proposito: se abren sin sesion, que es
 * justo lo que necesita quien todavia no creo la cuenta.
 */
export const RUTA_POR_DOCUMENTO = {
  terminos: '/legal/terminos',
  privacidad: '/legal/privacidad',
  'eliminar-cuenta': '/legal/eliminar-cuenta',
} as const satisfies Record<RutaLegal, Href>;
