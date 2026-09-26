import { useEsEscritorio } from '@/shared/hooks';

import { UsuariosEscritorio } from './escritorio/UsuariosEscritorio';
import { UsuariosMovil } from './movil/UsuariosMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function UsuariosScreen() {
  return useEsEscritorio() ? <UsuariosEscritorio /> : <UsuariosMovil />;
}
