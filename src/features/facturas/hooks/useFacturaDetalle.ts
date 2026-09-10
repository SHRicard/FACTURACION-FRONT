import { useCallback } from 'react';

import { interpretarError } from '@/shared/utils';

import { useFacturaDetalleQuery } from '../api/facturasApi';

/**
 * La cuenta de un periodo: la factura, sus tickets y sus pagos.
 *
 * La pantalla solo dibuja: el 404 ya viene distinguido del resto de los
 * errores, porque "esa factura no existe" y "no pudimos traerla" no ofrecen la
 * misma salida.
 */
export function useFacturaDetalle(id: string) {
  const consulta = useFacturaDetalleQuery(id, { skip: !id });
  const { refetch } = consulta;

  const error = interpretarError(consulta.error);

  /** Para el gesto de tirar para abajo. Devuelve la promesa a proposito. */
  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    detalle: consulta.data,
    cargando: consulta.isLoading,
    noExiste: error?.status === 404,
    error: error?.mensaje ?? null,
    refrescar,
    reintentar: refrescar,
  };
}
