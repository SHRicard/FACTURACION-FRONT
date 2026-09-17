import { useEsEscritorio } from '@/shared/hooks';

import { PerfilClienteEscritorio } from './escritorio/PerfilClienteEscritorio';
import { PerfilClienteMovil } from './movil/PerfilClienteMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function PerfilClienteScreen() {
  return useEsEscritorio() ? <PerfilClienteEscritorio /> : <PerfilClienteMovil />;
}
