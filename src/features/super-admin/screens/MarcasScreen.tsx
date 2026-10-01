import { useEsEscritorio } from '@/shared/hooks';

import { MarcasEscritorio } from './escritorio/MarcasEscritorio';
import { MarcasMovil } from './movil/MarcasMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function MarcasScreen() {
  return useEsEscritorio() ? <MarcasEscritorio /> : <MarcasMovil />;
}
