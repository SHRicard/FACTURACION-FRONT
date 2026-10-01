import { useCallback, useMemo, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useClientesInactivosInfiniteQuery } from '../api/metricasApi';
import type { ClienteInactivo, Opcion } from '../types';

/**
 * Cuantos dias sin comprar cuentan como "dejo de venir". El backend acepta de
 * 1 a 730; en la pantalla alcanza con tres escalones.
 */
export const DIAS_INACTIVO: readonly Opcion<number>[] = [
  { clave: 30, etiqueta: '30 días' },
  { clave: 60, etiqueta: '60 días' },
  { clave: 90, etiqueta: '90 días' },
];

/** El mismo que usa el backend cuando no se le manda nada. */
const DIAS_POR_DEFECTO = 60;

/**
 * Los que dejaron de comprar y todavia deben: el caso mas peligroso de la
 * libreta. Mientras el cliente sigue viniendo, la deuda se habla en el
 * mostrador; el que dejo de venir con la cuenta abierta es el que mas facil se
 * pierde.
 */
export function useClientesInactivos() {
  const [dias, setDias] = useState(DIAS_POR_DEFECTO);

  const consulta = useClientesInactivosInfiniteQuery(
    { dias, orden: 'saldo' },
    { refetchOnMountOrArgChange: true },
  );

  const { data, refetch, fetchNextPage } = consulta;

  /** Todas las paginas cargadas en una sola lista, que es lo que consume el FlatList. */
  const clientes: ClienteInactivo[] = useMemo(
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
    resumen: data?.pages[0]?.resumen,
    cargando: consulta.isLoading,
    /** Cambio los dias y se esta pidiendo: la lista de antes sigue a la vista. */
    actualizando: consulta.isFetching && !consulta.isLoading && !consulta.isFetchingNextPage,
    cargandoMas: consulta.isFetchingNextPage,
    hayMas: consulta.hasNextPage,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    dias,
    setDias,
    cargarMas,
    refrescar,
    reintentar: refrescar,
  };
}
