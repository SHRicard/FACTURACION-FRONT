import { useCallback } from 'react';

import { useRefrescarSesion } from '@/features/auth/hooks';
import { interpretarError } from '@/shared/utils';

import { useResumenDashboardQuery } from '../api/dashboardApi';

/**
 * El resumen del Inicio: a quien cobrarle, como viene el mes y que paso ultimo.
 *
 * Se re-pide al entrar (`refetchOnMountOrArgChange`): es la pantalla a la que
 * se vuelve despues de cargar un ticket o registrar un pago, y tiene que
 * mostrar los numeros de recien.
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
