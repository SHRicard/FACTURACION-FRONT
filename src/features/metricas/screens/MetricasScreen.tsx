import { useEsEscritorio } from '@/shared/hooks';

import { MetricasEscritorio } from './escritorio/MetricasEscritorio';
import { MetricasMovil } from './movil/MetricasMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function MetricasScreen() {
  return useEsEscritorio() ? <MetricasEscritorio /> : <MetricasMovil />;
}
