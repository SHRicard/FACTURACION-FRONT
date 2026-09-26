import { useEsEscritorio } from '@/shared/hooks';

import { UsuarioDetalleEscritorio } from './escritorio/UsuarioDetalleEscritorio';
import { UsuarioDetalleMovil } from './movil/UsuarioDetalleMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function UsuarioDetalleScreen() {
  return useEsEscritorio() ? <UsuarioDetalleEscritorio /> : <UsuarioDetalleMovil />;
}
