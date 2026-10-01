import { useCallback, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useVentasPorEspecieQuery } from '../api/metricasApi';
import type { Opcion, OrdenEspecies } from '../types';
import { usePeriodo } from './usePeriodo';

/** Que se mide: cuantas unidades salieron de cada especie, o la plata que dejo. */
export const MEDIDAS_ESPECIES: readonly Opcion<OrdenEspecies>[] = [
  { clave: 'unidades', etiqueta: 'Cantidad' },
  { clave: 'monto', etiqueta: 'Plata' },
];

/** Ventas por especie: que se vende mas, en unidades y en plata. */
export function useVentasPorEspecie() {
  const periodo = usePeriodo();
  const [orden, setOrden] = useState<OrdenEspecies>('unidades');

  const consulta = useVentasPorEspecieQuery(
    { ...periodo.rango, orden },
    { refetchOnMountOrArgChange: true },
  );
  const { refetch } = consulta;

  /** Para el gesto de tirar para abajo. Devuelve la promesa a proposito. */
  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    datos: consulta.data,
    cargando: consulta.isLoading,
    /** Cambio un filtro y se esta pidiendo: lo de antes sigue en pantalla. */
    actualizando: consulta.isFetching && !consulta.isLoading,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    periodo: periodo.clave,
    setPeriodo: periodo.setClave,
    orden,
    setOrden,
    refrescar,
    reintentar: refrescar,
  };
}
