import { useEsEscritorio } from '@/shared/hooks';

import { AvisosEscritorio } from './escritorio/AvisosEscritorio';
import { AvisosMovil } from './movil/AvisosMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function AvisosScreen() {
  return useEsEscritorio() ? <AvisosEscritorio /> : <AvisosMovil />;
}
