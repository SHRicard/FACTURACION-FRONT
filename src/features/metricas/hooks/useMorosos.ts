import { useCallback, useEffect, useMemo, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useMorososInfiniteQuery } from '../api/metricasApi';
import type { Agrupar, Moroso, Opcion, OrdenMorosos, PuntoMorosos } from '../types';
import { usePeriodo } from './usePeriodo';

/**
 * Cuanto se espera despues de la ultima tecla antes de buscar.
 *
 * Sin esto sale una request por letra: escribir "Gonzalez" dispararia ocho.
 */
const ESPERA_BUSQUEDA_MS = 300;

export const ORDENES_MOROSOS: readonly Opcion<OrdenMorosos>[] = [
  { clave: 'atraso', etiqueta: 'Más atrasados' },
  { clave: 'saldo', etiqueta: 'Más deben' },
];

/** Un punto del grafico por mes, o por semana (de lunes a domingo). */
export const AGRUPACIONES: readonly Opcion<Agrupar>[] = [
  { clave: 'mes', etiqueta: 'Por mes' },
  { clave: 'semana', etiqueta: 'Por semana' },
];

/**
 * Morosos: si la morosidad crece o baja, y a quien hay que ir a cobrar.
 *
 * Las tres partes (resumen, evolucion y la lista de hoy) llegan en la misma
 * respuesta. La busqueda filtra SOLO la lista: el resumen y el grafico siguen
 * siendo de toda la marca.
 */
export function useMorosos() {
  const periodo = usePeriodo();
  const [agrupar, setAgrupar] = useState<Agrupar>('mes');
  const [orden, setOrden] = useState<OrdenMorosos>('atraso');
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

  const consulta = useMorososInfiniteQuery(
    { ...periodo.rango, agrupar, orden, buscar: buscarAplicado },
    { refetchOnMountOrArgChange: true },
  );

  const { data, refetch, fetchNextPage } = consulta;

  /** El resumen y la evolucion vienen iguales en cada pagina: se leen de la primera. */
  const primera = data?.pages[0];

  /** Todas las paginas cargadas en una sola lista, que es lo que consume el FlatList. */
  const morosos: Moroso[] = useMemo(
    () => (data?.pages ?? []).flatMap((pagina) => pagina.morosos.datos),
    [data],
  );

  /*
   * Sin tocar nada se mira el ultimo punto, que es el de hoy. Si el que se
   * toco ya no esta (cambio el periodo o la agrupacion), tambien.
   */
  const evolucion = primera?.evolucion ?? [];
  const puntoElegido: PuntoMorosos | null =
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
    /** Periodo, agrupacion, resumen y evolucion: lo de toda la marca. */
    datos: primera,
    morosos,
    /** Cuantos coinciden con la busqueda, no cuantos se cargaron. */
    total: primera?.morosos.total ?? 0,
    puntoElegido,
    elegirPunto: setEtiquetaElegida,
    cargando: consulta.isLoading,
    /** Cambio un filtro y se esta pidiendo: lo de antes sigue a la vista. */
    actualizando: consulta.isFetching && !consulta.isLoading && !consulta.isFetchingNextPage,
    cargandoMas: consulta.isFetchingNextPage,
    hayMas: consulta.hasNextPage,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    /** "No hay morosos" y "la busqueda no encontro a nadie" son vacios distintos. */
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
