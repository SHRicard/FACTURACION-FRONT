import { useEsEscritorio } from '@/shared/hooks';

import { MiMarcaEscritorio } from './escritorio/MiMarcaEscritorio';
import { MiMarcaMovil } from './movil/MiMarcaMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 */
export function MiMarcaScreen() {
  return useEsEscritorio() ? <MiMarcaEscritorio /> : <MiMarcaMovil />;
}
