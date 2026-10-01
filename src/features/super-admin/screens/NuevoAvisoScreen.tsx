import { useEsEscritorio } from '@/shared/hooks';

import { NuevoAvisoEscritorio } from './escritorio/NuevoAvisoEscritorio';
import { NuevoAvisoMovil } from './movil/NuevoAvisoMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function NuevoAvisoScreen() {
  return useEsEscritorio() ? <NuevoAvisoEscritorio /> : <NuevoAvisoMovil />;
}
