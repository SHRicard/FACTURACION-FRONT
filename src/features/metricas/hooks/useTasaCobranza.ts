import { useCallback } from 'react';

import { interpretarError } from '@/shared/utils';

import { useTasaCobranzaQuery } from '../api/metricasApi';
import { usePeriodo } from './usePeriodo';

/** Tasa de cobranza: de lo que se fio en el periodo, cuanto volvio en pagos. */
export function useTasaCobranza() {
  const periodo = usePeriodo();
  const consulta = useTasaCobranzaQuery(periodo.rango, { refetchOnMountOrArgChange: true });
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
