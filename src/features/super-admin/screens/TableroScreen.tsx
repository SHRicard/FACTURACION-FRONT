import { useEsEscritorio } from '@/shared/hooks';

import { TableroEscritorio } from './escritorio/TableroEscritorio';
import { TableroMovil } from './movil/TableroMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function TableroScreen() {
  return useEsEscritorio() ? <TableroEscritorio /> : <TableroMovil />;
}
