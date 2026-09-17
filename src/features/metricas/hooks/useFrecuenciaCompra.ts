import { useCallback, useMemo, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useFrecuenciaCompraInfiniteQuery } from '../api/metricasApi';
import type { EstadoFrecuencia, FrecuenciaCliente, Opcion } from '../types';
import { usePeriodo } from './usePeriodo';

/** La pestana de la pantalla: un estado, o todos. */
export type FiltroFrecuencia = 'todos' | EstadoFrecuencia;

export const FILTROS_FRECUENCIA: readonly Opcion<FiltroFrecuencia>[] = [
  { clave: 'todos', etiqueta: 'Todos' },
  { clave: 'al-ritmo', etiqueta: 'Al ritmo' },
  { clave: 'demorado', etiqueta: 'Demorados' },
  { clave: 'sin-historial', etiqueta: 'Una sola visita' },
];

/**
 * Frecuencia de compra: cada cuanto vuelve cada cliente, y quien esta tardando
 * mas de lo normal.
 */
export function useFrecuenciaCompra() {
  const periodo = usePeriodo();
  const [filtro, setFiltro] = useState<FiltroFrecuencia>('todos');

  const consulta = useFrecuenciaCompraInfiniteQuery(
    {
      ...periodo.rango,
      estado: filtro === 'todos' ? undefined : filtro,
      // Mirando los demorados, lo que importa es el que mas se paso de su
      // ritmo, no el que mas seguido viene.
      orden: filtro === 'demorado' ? 'demorados' : 'frecuencia',
    },
    { refetchOnMountOrArgChange: true },
  );

  const { data, refetch, fetchNextPage } = consulta;

  /** Todas las paginas cargadas en una sola lista, que es lo que consume el FlatList. */
  const clientes: FrecuenciaCliente[] = useMemo(
    () => (data?.pages ?? []).flatMap((pagina) => pagina.datos),
    [data],
  );

  const cargarMas = useCallback(() => {
    // El guard evita encolar una pagina mas por cada rebote del scroll.
    if (consulta.hasNextPage && !consulta.isFetchingNextPage) void fetchNextPage();
  }, [consulta.hasNextPage, consulta.isFetchingNextPage, fetchNextPage]);

  /** Para el gesto de tirar para abajo. Devuelve la promesa a proposito. */
  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    clientes,
    /** De todos los que compraron en el periodo: no cambia con la pestana. */
    resumen: data?.pages[0]?.resumen,
    /** El rango que devolvio la API, para decir que se esta mirando. */
    rango: data?.pages[0]?.periodo,
    cargando: consulta.isLoading,
    /** Cambio un filtro y se esta pidiendo: la lista de antes sigue a la vista. */
    actualizando: consulta.isFetching && !consulta.isLoading && !consulta.isFetchingNextPage,
    cargandoMas: consulta.isFetchingNextPage,
    hayMas: consulta.hasNextPage,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    periodo: periodo.clave,
    setPeriodo: periodo.setClave,
    filtro,
    setFiltro,
    cargarMas,
    refrescar,
    reintentar: refrescar,
  };
}
