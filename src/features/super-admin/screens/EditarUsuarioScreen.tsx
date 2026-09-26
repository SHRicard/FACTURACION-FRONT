import { useEsEscritorio } from '@/shared/hooks';

import { EditarUsuarioEscritorio } from './escritorio/EditarUsuarioEscritorio';
import { EditarUsuarioMovil } from './movil/EditarUsuarioMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function EditarUsuarioScreen() {
  return useEsEscritorio() ? <EditarUsuarioEscritorio /> : <EditarUsuarioMovil />;
}
