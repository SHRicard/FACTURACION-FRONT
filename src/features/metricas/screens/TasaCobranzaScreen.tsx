import { useEsEscritorio } from '@/shared/hooks';

import { TasaCobranzaEscritorio } from './escritorio/TasaCobranzaEscritorio';
import { TasaCobranzaMovil } from './movil/TasaCobranzaMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function TasaCobranzaScreen() {
  return useEsEscritorio() ? <TasaCobranzaEscritorio /> : <TasaCobranzaMovil />;
}
