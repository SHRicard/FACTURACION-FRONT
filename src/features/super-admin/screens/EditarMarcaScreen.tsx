import { useEsEscritorio } from '@/shared/hooks';

import { EditarMarcaEscritorio } from './escritorio/EditarMarcaEscritorio';
import { EditarMarcaMovil } from './movil/EditarMarcaMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function EditarMarcaScreen() {
  return useEsEscritorio() ? <EditarMarcaEscritorio /> : <EditarMarcaMovil />;
}
