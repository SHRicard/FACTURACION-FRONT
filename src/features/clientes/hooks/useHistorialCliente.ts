import { useCallback, useMemo, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useHistorialClienteInfiniteQuery } from '../api/clientesApi';
import type { Movimiento, TipoMovimiento } from '../types';

export const TIPOS_MOVIMIENTO: readonly { clave: TipoMovimiento; etiqueta: string }[] = [
  { clave: 'todos', etiqueta: 'Todo' },
  { clave: 'compras', etiqueta: 'Compras' },
  { clave: 'pagos', etiqueta: 'Pagos' },
];

/**
 * Asi arranca el mensaje del 404 de una ruta que el backend no tiene. Un
 * cliente que no existe es otro 404 ("Cliente no encontrado"): el mensaje es
 * lo unico que los distingue.
 */
const RUTA_NO_ENCONTRADA = 'Ruta no encontrada';

/**
 * El historial completo de un cliente: cuanto debe y como viene, sus facturas,
 * y todo lo que compro y pago.
 *
 * `skip` cuando no hay id: expo-router puede montar la pantalla con el param
 * todavia vacio, y sin esto saldria una request a `/clientes//historial`.
 */
export function useHistorialCliente(id: string | undefined) {
  const [tipo, setTipo] = useState<TipoMovimiento>('todos');

  const consulta = useHistorialClienteInfiniteQuery({ id: id ?? '', tipo }, { skip: !id });
  const { data, refetch, fetchNextPage } = consulta;

  /** El cliente, el resumen y las facturas vienen iguales en cada pagina. */
  const primera = data?.pages[0];

  /** Todas las paginas cargadas en una sola lista, que es lo que consume el FlatList. */
  const movimientos: Movimiento[] = useMemo(
    () => (data?.pages ?? []).flatMap((pagina) => pagina.movimientos.datos),
    [data],
  );

  const cargarMas = useCallback(() => {
    // El guard evita encolar una pagina mas por cada rebote del scroll.
    if (consulta.hasNextPage && !consulta.isFetchingNextPage) void fetchNextPage();
  }, [consulta.hasNextPage, consulta.isFetchingNextPage, fetchNextPage]);

  /** Para el gesto de tirar para abajo. Devuelve la promesa a proposito. */
  const refrescar = useCallback(async () => {
    // Una query salteada no se puede re-pedir: RTK Query tira error.
    if (!id) return;
    await refetch();
  }, [id, refetch]);

  const error = interpretarError(consulta.error);
  const sinServicio = error?.status === 404 && error.mensaje.startsWith(RUTA_NO_ENCONTRADA);

  return {
    cliente: primera?.cliente ?? null,
    resumen: primera?.resumen ?? null,
    facturas: primera?.facturas ?? [],
    movimientos,
    cargando: consulta.isLoading,
    /** Cambio el filtro y se esta pidiendo: la lista de antes sigue a la vista. */
    actualizando: consulta.isFetching && !consulta.isLoading && !consulta.isFetchingNextPage,
    cargandoMas: consulta.isFetchingNextPage,
    hayMas: consulta.hasNextPage,
    error: error?.mensaje ?? null,
    /** El backend todavia no tiene el servicio (ver `docs/HISTORIAL_CLIENTE.md`). */
    sinServicio,
    /** El cliente no existe, o es de otra marca. */
    noExiste: error?.status === 404 && !sinServicio,
    tipo,
    setTipo,
    cargarMas,
    refrescar,
    reintentar: refrescar,
  };
}
