import { useEsEscritorio } from '@/shared/hooks';

import { ErrorDetalleEscritorio } from './escritorio/ErrorDetalleEscritorio';
import { ErrorDetalleMovil } from './movil/ErrorDetalleMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function ErrorDetalleScreen() {
  return useEsEscritorio() ? <ErrorDetalleEscritorio /> : <ErrorDetalleMovil />;
}
