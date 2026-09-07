import { useCallback, useEffect, useMemo, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useListarClientesInfiniteQuery } from '../api/clientesApi';
import type { ClienteEnLista } from '../types';

/**
 * Cuanto se espera despues de la ultima tecla antes de buscar.
 *
 * Sin esto sale una request por letra: escribir "Gonzalez" dispararia ocho.
 */
const ESPERA_BUSQUEDA_MS = 300;

/**
 * Listado de clientes: busqueda, filtros y scroll infinito.
 *
 * La pantalla no sabe nada de paginas ni de debounce: recibe la lista ya
 * aplanada y las funciones para pedir mas o refrescar.
 */
export function useClientes() {
  // Lo que se ve escrito en el buscador. Cambia en cada tecla.
  const [buscar, setBuscar] = useState('');
  // Lo que realmente viaja a la API. Va un ratito atras del anterior.
  const [buscarAplicado, setBuscarAplicado] = useState('');
  const [deudores, setDeudores] = useState(false);
  const [vencidos, setVencidos] = useState(false);

  useEffect(() => {
    const temporizador = setTimeout(() => setBuscarAplicado(buscar), ESPERA_BUSQUEDA_MS);
    // Cada tecla cancela el timer anterior: solo sobrevive la ultima.
    return () => clearTimeout(temporizador);
  }, [buscar]);

  const consulta = useListarClientesInfiniteQuery({
    buscar: buscarAplicado,
    deudores,
    vencidos,
  });

  const { data, refetch, fetchNextPage } = consulta;

  /**
   * Todas las paginas cargadas en una sola lista, que es lo que consume el
   * FlatList. `datos` de cada pagina ya viene validado por Zod.
   */
  const clientes: ClienteEnLista[] = useMemo(
    () => (data?.pages ?? []).flatMap((pagina) => pagina.datos),
    [data],
  );

  /** El total del backend, no el largo de lo cargado: sirve para el encabezado. */
  const total = data?.pages[0]?.total ?? 0;

  const cargarMas = useCallback(() => {
    // El guard evita encolar una pagina mas por cada rebote del scroll.
    if (consulta.hasNextPage && !consulta.isFetchingNextPage) void fetchNextPage();
  }, [consulta.hasNextPage, consulta.isFetchingNextPage, fetchNextPage]);

  /** Para el gesto de tirar para abajo. Devuelve la promesa a proposito. */
  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const hayFiltros = buscarAplicado.trim() !== '' || deudores || vencidos;

  return {
    clientes,
    total,
    /** Primera carga: todavia no hay ninguna fila para mostrar. */
    cargando: consulta.isLoading,
    /** Trayendo la pagina siguiente: va al pie de la lista, no tapa la pantalla. */
    cargandoMas: consulta.isFetchingNextPage,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    hayMas: consulta.hasNextPage,
    /**
     * Distingue "este negocio no tiene clientes" de "la busqueda no encontro
     * nada": son dos pantallas vacias distintas y la segunda no lleva boton de
     * alta, lleva "limpiar filtros".
     */
    hayFiltros,
    buscar,
    setBuscar,
    deudores,
    vencidos,
    alternarDeudores: useCallback(() => setDeudores((valor) => !valor), []),
    alternarVencidos: useCallback(() => setVencidos((valor) => !valor), []),
    limpiarFiltros: useCallback(() => {
      setBuscar('');
      setBuscarAplicado('');
      setDeudores(false);
      setVencidos(false);
    }, []),
    cargarMas,
    refrescar,
    reintentar: refrescar,
  };
}
