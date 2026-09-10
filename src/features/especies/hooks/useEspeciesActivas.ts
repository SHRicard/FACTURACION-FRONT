import { useMemo } from 'react';

import { interpretarError } from '@/shared/utils';

import { useListarEspeciesQuery } from '../api/especiesApi';

/**
 * Las especies que se pueden elegir al cargar un ticket.
 *
 * El backend no filtra por `activo`: manda todas y el filtro es del front. Se
 * hace aca, una sola vez, para que ninguna pantalla se olvide y termine
 * ofreciendo una especie que el negocio dio de baja.
 */
export function useEspeciesActivas() {
  const consulta = useListarEspeciesQuery();

  const especies = useMemo(
    () => (consulta.data ?? []).filter((especie) => especie.activo),
    [consulta.data],
  );

  return {
    especies,
    cargando: consulta.isLoading,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    /** Sin ninguna activa no se puede cargar un ticket: hay que crear una. */
    vacio: !consulta.isLoading && especies.length === 0,
  };
}
