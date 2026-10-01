import { useCallback, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useMejoresClientesQuery } from '../api/metricasApi';
import type { Opcion, OrdenMejores } from '../types';
import { usePeriodo } from './usePeriodo';

/**
 * Dos rankings sobre la misma lista, porque no siempre coinciden: el que mas se
 * lleva puede ser el que peor paga. El mejor cliente es el de mejor
 * cumplimiento: por eso va primero y es el que se abre.
 */
export const PESTANAS_MEJORES: readonly Opcion<OrdenMejores>[] = [
  { clave: 'cumplimiento', etiqueta: 'Mejor cumplimiento' },
  { clave: 'compras', etiqueta: 'Más compran' },
];

/** Mejores clientes: a quien cuidar, y a quien se le puede subir el limite. */
export function useMejoresClientes() {
  const periodo = usePeriodo();
  const [orden, setOrden] = useState<OrdenMejores>('cumplimiento');

  const consulta = useMejoresClientesQuery(
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
