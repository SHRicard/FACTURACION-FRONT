import { useEsEscritorio } from '@/shared/hooks';

import { MejoresClientesEscritorio } from './escritorio/MejoresClientesEscritorio';
import { MejoresClientesMovil } from './movil/MejoresClientesMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function MejoresClientesScreen() {
  return useEsEscritorio() ? <MejoresClientesEscritorio /> : <MejoresClientesMovil />;
}
