import { useEsEscritorio } from '@/shared/hooks';

import { DeudoresEscritorio } from './escritorio/DeudoresEscritorio';
import { DeudoresMovil } from './movil/DeudoresMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function DeudoresScreen() {
  return useEsEscritorio() ? <DeudoresEscritorio /> : <DeudoresMovil />;
}
