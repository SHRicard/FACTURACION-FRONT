import { useEsEscritorio } from '@/shared/hooks';

import { PagoFormEscritorio } from './escritorio/PagoFormEscritorio';
import { PagoFormMovil } from './movil/PagoFormMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma: una tablet en horizontal es
 * escritorio, un celular en el navegador es movil. Ver `useEsEscritorio`.
 */
export function PagoFormScreen() {
  return useEsEscritorio() ? <PagoFormEscritorio /> : <PagoFormMovil />;
}
