import { useEsEscritorio } from '@/shared/hooks';

import { ConfiguracionEscritorio } from './escritorio/ConfiguracionEscritorio';
import { ConfiguracionMovil } from './movil/ConfiguracionMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma: una tablet en horizontal es
 * escritorio, un celular en el navegador es movil. Ver `useEsEscritorio`.
 */
export function ConfiguracionScreen() {
  return useEsEscritorio() ? <ConfiguracionEscritorio /> : <ConfiguracionMovil />;
}
