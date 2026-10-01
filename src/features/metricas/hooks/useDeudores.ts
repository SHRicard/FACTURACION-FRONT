import { useCallback, useEffect, useMemo, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useDeudoresInfiniteQuery } from '../api/metricasApi';
import type { Agrupar, Deudor, Opcion, OrdenDeudores, PuntoDeudores } from '../types';
import { usePeriodo } from './usePeriodo';

/**
 * Cuanto se espera despues de la ultima tecla antes de buscar.
 *
 * Sin esto sale una request por letra: escribir "Gonzalez" dispararia ocho.
 */
const ESPERA_BUSQUEDA_MS = 300;

export const ORDENES_DEUDORES: readonly Opcion<OrdenDeudores>[] = [
  { clave: 'saldo', etiqueta: 'Los que más deben' },
  { clave: 'atraso', etiqueta: 'Los más atrasados' },
];

/**
 * Deudores: cuanta plata hay en la calle y quien la tiene.
 *
 * Deudor es quien debe algo, vencido o no; el moroso —el que ya vencio— tiene
 * su propia metrica. El resumen y la evolucion son de toda la marca: la
 * busqueda filtra solo la lista.
 */
export function useDeudores() {
  const periodo = usePeriodo();
  const [agrupar, setAgrupar] = useState<Agrupar>('mes');
  const [orden, setOrden] = useState<OrdenDeudores>('saldo');
  // Lo que se ve escrito en el buscador. Cambia en cada tecla.
  const [buscar, setBuscar] = useState('');
  // Lo que realmente viaja a la API. Va un ratito atras del anterior.
  const [buscarAplicado, setBuscarAplicado] = useState('');
  /** El punto del grafico que se toco, por su etiqueta. */
  const [etiquetaElegida, setEtiquetaElegida] = useState<string | null>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => setBuscarAplicado(buscar), ESPERA_BUSQUEDA_MS);
    // Cada tecla cancela el timer anterior: solo sobrevive la ultima.
    return () => clearTimeout(temporizador);
  }, [buscar]);

  const consulta = useDeudoresInfiniteQuery(
    { ...periodo.rango, agrupar, orden, buscar: buscarAplicado },
    { refetchOnMountOrArgChange: true },
  );

  const { data, refetch, fetchNextPage } = consulta;

  /** El resumen y la evolucion vienen iguales en cada pagina: se leen de la primera. */
  const primera = data?.pages[0];

  /** Todas las paginas cargadas en una sola lista, que es lo que consume el FlatList. */
  const deudores: Deudor[] = useMemo(
    () => (data?.pages ?? []).flatMap((pagina) => pagina.datos),
    [data],
  );

  /*
   * Sin tocar nada se mira el ultimo punto, que es el de hoy. Si el que se
   * toco ya no esta (cambio el periodo o la agrupacion), tambien.
   */
  const evolucion = primera?.evolucion ?? [];
  const puntoElegido: PuntoDeudores | null =
    evolucion.find((punto) => punto.etiqueta === etiquetaElegida) ??
    evolucion[evolucion.length - 1] ??
    null;

  const cargarMas = useCallback(() => {
    // El guard evita encolar una pagina mas por cada rebote del scroll.
    if (consulta.hasNextPage && !consulta.isFetchingNextPage) void fetchNextPage();
  }, [consulta.hasNextPage, consulta.isFetchingNextPage, fetchNextPage]);

  /** Para el gesto de tirar para abajo. Devuelve la promesa a proposito. */
  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    deudores,
    /** Periodo, agrupacion, resumen y evolucion: lo de toda la marca. */
    datos: primera,
    /** Cuantos coinciden con la busqueda, no cuantos se cargaron. */
    total: primera?.total ?? 0,
    /** `null` mientras el backend no mande la evolucion: sin puntos no hay grafico. */
    puntoElegido,
    elegirPunto: setEtiquetaElegida,
    cargando: consulta.isLoading,
    /** Cambio un filtro y se esta pidiendo: la lista de antes sigue a la vista. */
    actualizando: consulta.isFetching && !consulta.isLoading && !consulta.isFetchingNextPage,
    cargandoMas: consulta.isFetchingNextPage,
    hayMas: consulta.hasNextPage,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    /** "Nadie debe nada" y "la busqueda no encontro a nadie" son vacios distintos. */
    buscando: buscarAplicado.trim() !== '',
    buscar,
    setBuscar,
    orden,
    setOrden,
    agrupar,
    setAgrupar,
    periodo: periodo.clave,
    setPeriodo: periodo.setClave,
    limpiarBusqueda: useCallback(() => {
      setBuscar('');
      setBuscarAplicado('');
    }, []),
    cargarMas,
    refrescar,
    reintentar: refrescar,
  };
}
