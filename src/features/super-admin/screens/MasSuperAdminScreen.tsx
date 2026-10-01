import { useEsEscritorio } from '@/shared/hooks';

import { MasSuperAdminEscritorio } from './escritorio/MasSuperAdminEscritorio';
import { MasSuperAdminMovil } from './movil/MasSuperAdminMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function MasSuperAdminScreen() {
  return useEsEscritorio() ? <MasSuperAdminEscritorio /> : <MasSuperAdminMovil />;
}
