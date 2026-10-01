import { useEsEscritorio } from '@/shared/hooks';

import { MarcaDetalleEscritorio } from './escritorio/MarcaDetalleEscritorio';
import { MarcaDetalleMovil } from './movil/MarcaDetalleMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function MarcaDetalleScreen() {
  return useEsEscritorio() ? <MarcaDetalleEscritorio /> : <MarcaDetalleMovil />;
}
