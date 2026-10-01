import { useCallback } from 'react';

import { interpretarError } from '@/shared/utils';

import { useDetalleUsuarioAdminQuery } from '../api/superAdminApi';

/**
 * La ficha de una cuenta: sus datos, su marca, su actividad y en que paso del
 * onboarding quedo.
 *
 * `skip` sin id: expo-router puede montar la pantalla con el param vacio.
 */
export function useUsuarioAdmin(id: string | undefined) {
  const consulta = useDetalleUsuarioAdminQuery(id ?? '', { skip: !id });
  const { refetch } = consulta;

  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const detalle = interpretarError(consulta.error);

  return {
    detalle: consulta.data ?? null,
    cargando: consulta.isLoading,
    error: detalle?.mensaje ?? null,
    /** Un 404 es "esta cuenta no existe" (o ya se borro), no "algo se rompio". */
    noExiste: detalle?.status === 404,
    refrescar,
    reintentar: refrescar,
  };
}
