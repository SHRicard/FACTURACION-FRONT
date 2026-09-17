import { useEsEscritorio } from '@/shared/hooks';

import { FrecuenciaCompraEscritorio } from './escritorio/FrecuenciaCompraEscritorio';
import { FrecuenciaCompraMovil } from './movil/FrecuenciaCompraMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function FrecuenciaCompraScreen() {
  return useEsEscritorio() ? <FrecuenciaCompraEscritorio /> : <FrecuenciaCompraMovil />;
}
