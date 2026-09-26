import { useEsEscritorio } from '@/shared/hooks';

import { ErroresEscritorio } from './escritorio/ErroresEscritorio';
import { ErroresMovil } from './movil/ErroresMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function ErroresScreen() {
  return useEsEscritorio() ? <ErroresEscritorio /> : <ErroresMovil />;
}
