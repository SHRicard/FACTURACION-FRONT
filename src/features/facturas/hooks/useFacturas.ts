import { useCallback, useEffect, useMemo, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useListarFacturasInfiniteQuery } from '../api/facturasApi';
import type { FacturaEnLista, FiltrosFacturas } from '../types';

/**
 * Cuanto se espera despues de la ultima tecla antes de buscar.
 *
 * Sin esto sale una request por letra: escribir "Gonzalez" dispararia ocho.
 */
const ESPERA_BUSQUEDA_MS = 300;

/**
 * Los filtros de la pantalla, excluyentes entre si.
 *
 * Son excluyentes a proposito: "vencidas" NO es un estado —busca fecha pasada
 * con saldo— asi que combinarlo con "pagadas" no devolveria nada, porque una
 * pagada no tiene saldo. Un solo chip prendido evita esa combinacion muerta.
 */
export type FiltroFacturas = 'todas' | 'abiertas' | 'vencidas' | 'pagadas';

export const FILTROS_FACTURAS: readonly { clave: FiltroFacturas; etiqueta: string }[] = [
  { clave: 'todas', etiqueta: 'Todas' },
  { clave: 'abiertas', etiqueta: 'Abiertas' },
  { clave: 'vencidas', etiqueta: 'Vencidas' },
  { clave: 'pagadas', etiqueta: 'Pagadas' },
];

/** Del chip a lo que entiende la API. */
function aFiltrosApi(filtro: FiltroFacturas): FiltrosFacturas {
  switch (filtro) {
    case 'abiertas':
      return { estado: 'abierta' };
    case 'vencidas':
      return { vencidas: true };
    case 'pagadas':
      return { estado: 'pagada' };
    default:
      return {};
  }
}

/**
 * Listado de facturas: busqueda por cliente, filtro por estado y scroll
 * infinito.
 *
 * La pantalla no sabe nada de paginas ni de debounce: recibe la lista ya
 * aplanada y las funciones para pedir mas o refrescar.
 */
export function useFacturas() {
  // Lo que se ve escrito en el buscador. Cambia en cada tecla.
  const [buscar, setBuscar] = useState('');
  // Lo que realmente viaja a la API. Va un ratito atras del anterior.
  const [buscarAplicado, setBuscarAplicado] = useState('');
  const [filtro, setFiltro] = useState<FiltroFacturas>('todas');

  useEffect(() => {
    const temporizador = setTimeout(() => setBuscarAplicado(buscar), ESPERA_BUSQUEDA_MS);
    // Cada tecla cancela el timer anterior: solo sobrevive la ultima.
    return () => clearTimeout(temporizador);
  }, [buscar]);

  const consulta = useListarFacturasInfiniteQuery({
    ...aFiltrosApi(filtro),
    buscar: buscarAplicado,
  });

  const { data, refetch, fetchNextPage } = consulta;

  /**
   * Todas las paginas cargadas en una sola lista, que es lo que consume el
   * FlatList. `datos` de cada pagina ya viene validado por Zod.
   */
  const facturas: FacturaEnLista[] = useMemo(
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

  return {
    facturas,
    total,
    /** Primera carga: todavia no hay ninguna fila para mostrar. */
    cargando: consulta.isLoading,
    /** Trayendo la pagina siguiente: va al pie de la lista, no tapa la pantalla. */
    cargandoMas: consulta.isFetchingNextPage,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    hayMas: consulta.hasNextPage,
    /**
     * Distingue "este negocio no facturo nunca" de "la busqueda no encontro
     * nada": son dos pantallas vacias distintas.
     */
    hayFiltros: buscarAplicado.trim() !== '' || filtro !== 'todas',
    buscar,
    setBuscar,
    filtro,
    setFiltro,
    limpiarFiltros: useCallback(() => {
      setBuscar('');
      setBuscarAplicado('');
      setFiltro('todas');
    }, []),
    cargarMas,
    refrescar,
    reintentar: refrescar,
  };
}
