import { useEsEscritorio } from '@/shared/hooks';

import { SistemaEscritorio } from './escritorio/SistemaEscritorio';
import { SistemaMovil } from './movil/SistemaMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function SistemaScreen() {
  return useEsEscritorio() ? <SistemaEscritorio /> : <SistemaMovil />;
}
