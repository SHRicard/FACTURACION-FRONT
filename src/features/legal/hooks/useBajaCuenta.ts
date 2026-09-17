import { useCallback } from 'react';

import { interpretarError } from '@/shared/utils';

import { useBajaCuentaQuery } from '../api/legalApi';

/**
 * Los pasos de la baja, tal como los publica el backend.
 *
 * Es el mismo contenido que la pagina web que Google exige como "recurso web
 * externo": asi lo que se lee adentro de la app y lo que lee el revisor afuera
 * no se pueden desincronizar.
 */
export function useBajaCuenta() {
  const consulta = useBajaCuentaQuery();
  const { refetch } = consulta;

  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    baja: consulta.data ?? null,
    cargando: consulta.isLoading,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    refrescar,
    reintentar: refrescar,
  };
}
