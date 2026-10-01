import { useCallback } from 'react';

import { interpretarError } from '@/shared/utils';

import { useEstadoSistemaQuery } from '../api/superAdminApi';

/** El estado tecnico: server, base, servicios y versiones de la app en uso. Solo lectura. */
export function useSistema() {
  const consulta = useEstadoSistemaQuery();
  const { refetch } = consulta;

  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    sistema: consulta.data ?? null,
    cargando: consulta.isLoading,
    /** Tocar "Refrescar": la rueda va en el boton, no tapa la pantalla. */
    actualizando: consulta.isFetching && !consulta.isLoading,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    refrescar,
    reintentar: refrescar,
  };
}
