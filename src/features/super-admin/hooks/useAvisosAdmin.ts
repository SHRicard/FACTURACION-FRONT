import { useCallback, useMemo } from 'react';

import { interpretarError } from '@/shared/utils';

import { useListarAvisosAdminInfiniteQuery } from '../api/avisosApi';
import type { AvisoAdmin } from '../types';

/** El historial de avisos enviados, el mas nuevo primero. */
export function useAvisosAdmin() {
  const consulta = useListarAvisosAdminInfiniteQuery();
  const { data, refetch, fetchNextPage } = consulta;

  const avisos: AvisoAdmin[] = useMemo(
    () => (data?.pages ?? []).flatMap((pagina) => pagina.datos),
    [data],
  );

  const cargarMas = useCallback(() => {
    if (consulta.hasNextPage && !consulta.isFetchingNextPage) void fetchNextPage();
  }, [consulta.hasNextPage, consulta.isFetchingNextPage, fetchNextPage]);

  const refrescar = useCallback(async () => {
    await refetch({ refetchCachedPages: false });
  }, [refetch]);

  return {
    avisos,
    total: data?.pages[0]?.total ?? 0,
    cargando: consulta.isLoading,
    cargandoMas: consulta.isFetchingNextPage,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    hayMas: consulta.hasNextPage,
    cargarMas,
    refrescar,
    reintentar: refrescar,
  };
}
