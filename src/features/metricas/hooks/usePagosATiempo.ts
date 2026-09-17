import { useCallback } from 'react';

import { interpretarError } from '@/shared/utils';

import { usePagosATiempoQuery } from '../api/metricasApi';
import { usePeriodo } from './usePeriodo';

/**
 * Pagos a tiempo: que tan puntual es la clientela.
 *
 * ⚠️ El periodo es el de VENCIMIENTO: "de las que vencian en agosto, ¿cuantas
 * se pagaron a tiempo?". La pantalla lo aclara, porque se lee facil como el
 * periodo de pago.
 */
export function usePagosATiempo() {
  const periodo = usePeriodo();
  const consulta = usePagosATiempoQuery(periodo.rango, { refetchOnMountOrArgChange: true });
  const { refetch } = consulta;

  /** Para el gesto de tirar para abajo. Devuelve la promesa a proposito. */
  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    datos: consulta.data,
    cargando: consulta.isLoading,
    /** Cambio el periodo y se esta pidiendo: lo de antes sigue en pantalla. */
    actualizando: consulta.isFetching && !consulta.isLoading,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    periodo: periodo.clave,
    setPeriodo: periodo.setClave,
    refrescar,
    reintentar: refrescar,
  };
}
