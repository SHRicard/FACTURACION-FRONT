import { useEsEscritorio } from '@/shared/hooks';

import { MorososEscritorio } from './escritorio/MorososEscritorio';
import { MorososMovil } from './movil/MorososMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function MorososScreen() {
  return useEsEscritorio() ? <MorososEscritorio /> : <MorososMovil />;
}
