import { useCallback } from 'react';

import { useRefrescarSesion } from '@/features/auth/hooks';
import { interpretarError } from '@/shared/utils';

import { useResumenDashboardQuery } from '../api/dashboardApi';

/**
 * El resumen del Inicio: a quien cobrarle, como viene el mes y que paso ultimo.
 *
 * El Inicio es un tab y queda montado al cambiar de tab (`popToTopOnBlur` solo
 * vacia los stacks), asi que `refetchOnMountOrArgChange` alcanza para la
 * primera entrada y nada mas. Se mantiene al dia porque las mutaciones que
 * mueven plata o clientes invalidan `{Metrica,'TODAS'}` (ticketsApi, pagosApi,
 * clientesApi, facturasApi).
 */
export function useDashboard() {
  const consulta = useResumenDashboardQuery(undefined, { refetchOnMountOrArgChange: true });
  const { refetch } = consulta;
  const refrescarSesion = useRefrescarSesion();

  /**
   * En paralelo: son independientes y encadenarlas duplicaria el tiempo que la
   * rueda queda girando.
   */
  const refrescar = useCallback(async () => {
    await Promise.all([refetch(), refrescarSesion()]);
  }, [refetch, refrescarSesion]);

  return {
    resumen: consulta.data ?? null,
    cargando: consulta.isLoading,
    /** Se esta re-pidiendo con datos en pantalla: lo de antes sigue a la vista. */
    actualizando: consulta.isFetching && !consulta.isLoading,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    refrescar,
    reintentar: refrescar,
  };
}
