import { useEsEscritorio } from '@/shared/hooks';

import { HistorialClienteEscritorio } from './escritorio/HistorialClienteEscritorio';
import { HistorialClienteMovil } from './movil/HistorialClienteMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function HistorialClienteScreen() {
  return useEsEscritorio() ? <HistorialClienteEscritorio /> : <HistorialClienteMovil />;
}
