import { useCallback } from 'react';

import { interpretarError } from '@/shared/utils';

import { useClienteDetalleQuery } from '../api/clientesApi';

/**
 * Ficha de un cliente: sus datos, su deuda total y su factura abierta.
 *
 * `skip` cuando no hay id: expo-router puede montar la pantalla con el param
 * todavia vacio, y sin esto saldria una request a `/clientes/undefined`.
 */
export function useCliente(id: string | undefined) {
  const consulta = useClienteDetalleQuery(id ?? '', { skip: !id });
  const { refetch } = consulta;

  // Depende de `refetch` y no de `consulta`: el objeto de la consulta es nuevo
  // en cada render, y arrastraria a recrear el RefreshControl entero.
  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const detalle = interpretarError(consulta.error);

  return {
    cliente: consulta.data ?? null,
    cargando: consulta.isLoading,
    error: detalle?.mensaje ?? null,
    /** Un 404 es "este cliente no existe", no "algo se rompio". */
    noExiste: detalle?.status === 404,
    refrescar,
    reintentar: refrescar,
  };
}
