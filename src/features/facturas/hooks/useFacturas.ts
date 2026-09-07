import { useCallback } from 'react';

import { useRefrescarSesion } from '@/features/auth/hooks';
import { useRefrescarApi } from '@/shared/hooks';

/**
 * Datos de el listado de facturas.
 *
 * ⚠️ Todavia no hay endpoint propio (GET /facturas no existe). Lo que si esta es el
 * `refrescar`, para que el gesto de tirar para abajo quede cableado desde el
 * dia uno: cuando llegue la query, se agrega aca y `refrescar` pasa a ser su
 * `refetch` — la pantalla no se toca.
 */
export function useFacturas() {
  const refrescarApi = useRefrescarApi();
  const refrescarSesion = useRefrescarSesion();

  /**
   * En paralelo: son independientes y encadenarlas duplicaria el tiempo que la
   * rueda queda girando.
   */
  const refrescar = useCallback(async () => {
    await Promise.all([refrescarApi(), refrescarSesion()]);
  }, [refrescarApi, refrescarSesion]);

  return { refrescar };
}
