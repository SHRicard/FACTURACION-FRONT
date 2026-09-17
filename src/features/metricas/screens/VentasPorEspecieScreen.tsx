import { useEsEscritorio } from '@/shared/hooks';

import { VentasPorEspecieEscritorio } from './escritorio/VentasPorEspecieEscritorio';
import { VentasPorEspecieMovil } from './movil/VentasPorEspecieMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function VentasPorEspecieScreen() {
  return useEsEscritorio() ? <VentasPorEspecieEscritorio /> : <VentasPorEspecieMovil />;
}
