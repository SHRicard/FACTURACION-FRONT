import { useCallback, useMemo } from 'react';

import { interpretarError } from '@/shared/utils';

import { useListarEspeciesQuery } from '../api/especiesApi';

/**
 * Las especies que se pueden elegir al cargar un ticket.
 *
 * El backend no filtra por `activo`: manda todas y el filtro es del front. Se
 * hace aca, una sola vez, para que ninguna pantalla se olvide y termine
 * ofreciendo una especie que el negocio dio de baja.
 *
 * La `cantidad` NO filtra: una especie en 0 se sigue pudiendo elegir. El ticket
 * nunca se frena por falta de cantidad, el backend solo la deja en 0.
 */
export function useEspeciesActivas() {
  const consulta = useListarEspeciesQuery();
  const { refetch } = consulta;

  const especies = useMemo(
    () => (consulta.data ?? []).filter((especie) => especie.activo),
    [consulta.data],
  );

  // Depende de `refetch` y no de `consulta`: el objeto de la consulta es nuevo
  // en cada render.
  const reintentar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    especies,
    cargando: consulta.isLoading,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    /**
     * Sin ninguna activa no se puede cargar un ticket: hay que crear una. Solo
     * con la lista en la mano: si la carga fallo no hay data, y eso no es "no
     * hay especies" (mandaria a crear una que ya existe).
     */
    vacio: !consulta.isLoading && consulta.data !== undefined && especies.length === 0,
    /** La lista no llego (sin red, error del servidor): va con Reintentar. */
    falloLaCarga:
      !consulta.isLoading && consulta.data === undefined && consulta.error !== undefined,
    reintentar,
  };
}
