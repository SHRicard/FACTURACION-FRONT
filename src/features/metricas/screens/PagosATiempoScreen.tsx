import { useEsEscritorio } from '@/shared/hooks';

import { PagosATiempoEscritorio } from './escritorio/PagosATiempoEscritorio';
import { PagosATiempoMovil } from './movil/PagosATiempoMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function PagosATiempoScreen() {
  return useEsEscritorio() ? <PagosATiempoEscritorio /> : <PagosATiempoMovil />;
}
