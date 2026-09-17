import { useEsEscritorio } from '@/shared/hooks';

import { ClientesInactivosEscritorio } from './escritorio/ClientesInactivosEscritorio';
import { ClientesInactivosMovil } from './movil/ClientesInactivosMovil';

/**
 * Elige que composicion se dibuja. No hace nada mas: los datos viven en los
 * hooks de la feature y los comparten las dos vistas.
 *
 * Corta por ANCHO de ventana, no por plataforma. Ver `useEsEscritorio`.
 */
export function ClientesInactivosScreen() {
  return useEsEscritorio() ? <ClientesInactivosEscritorio /> : <ClientesInactivosMovil />;
}
