import { useCallback, useMemo, useState } from 'react';

import type { Opcion } from '@/features/metricas/types';
import { interpretarError } from '@/shared/utils';

import { useListarUsuariosAdminInfiniteQuery } from '../api/superAdminApi';
import type { FiltrosUsuarios, UsuarioEnListado } from '../types';
import { useBusquedaDiferida } from './useBusquedaDiferida';

/**
 * Los filtros rapidos del listado (docs/SUPER_ADMIN.md, 5.1). "Trabados en
 * onboarding" va partido en dos porque el backend filtra un paso por vez.
 */
export type FiltroRapidoUsuarios = 'todos' | 'sinDni' | 'sinMarca' | 'inactivos' | 'suspendidos';

export const FILTROS_RAPIDOS_USUARIOS: readonly Opcion<FiltroRapidoUsuarios>[] = [
  { clave: 'todos', etiqueta: 'Todos' },
  { clave: 'sinDni', etiqueta: 'Sin DNI' },
  { clave: 'sinMarca', etiqueta: 'Sin marca' },
  { clave: 'inactivos', etiqueta: 'Inactivos 30 días' },
  { clave: 'suspendidos', etiqueta: 'Suspendidos' },
];

const FILTRO_API: Record<FiltroRapidoUsuarios, FiltrosUsuarios> = {
  todos: {},
  sinDni: { onboarding: 'perfil' },
  sinMarca: { onboarding: 'marca' },
  inactivos: { inactivosDias: 30 },
  suspendidos: { suspendida: true },
};

/**
 * Listado de cuentas: buscador (nombre, email o DNI), filtros rapidos y scroll
 * infinito. La pantalla recibe la lista ya aplanada.
 */
export function useUsuarios() {
  const busqueda = useBusquedaDiferida();
  const [filtro, setFiltro] = useState<FiltroRapidoUsuarios>('todos');

  const consulta = useListarUsuariosAdminInfiniteQuery({
    buscar: busqueda.aplicado,
    ...FILTRO_API[filtro],
  });
  const { data, refetch, fetchNextPage } = consulta;

  const usuarios: UsuarioEnListado[] = useMemo(
    () => (data?.pages ?? []).flatMap((pagina) => pagina.datos),
    [data],
  );

  const cargarMas = useCallback(() => {
    if (consulta.hasNextPage && !consulta.isFetchingNextPage) void fetchNextPage();
  }, [consulta.hasNextPage, consulta.isFetchingNextPage, fetchNextPage]);

  /** El gesto pide solo la primera pagina; la invalidacion, todas las cargadas. */
  const refrescar = useCallback(async () => {
    await refetch({ refetchCachedPages: false });
  }, [refetch]);

  const { limpiar } = busqueda;

  return {
    usuarios,
    total: data?.pages[0]?.total ?? 0,
    cargando: consulta.isLoading,
    cargandoMas: consulta.isFetchingNextPage,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    hayMas: consulta.hasNextPage,
    hayFiltros: busqueda.aplicado.trim() !== '' || filtro !== 'todos',
    buscar: busqueda.buscar,
    setBuscar: busqueda.setBuscar,
    filtro,
    setFiltro,
    limpiarFiltros: useCallback(() => {
      limpiar();
      setFiltro('todos');
    }, [limpiar]),
    cargarMas,
    refrescar,
    reintentar: refrescar,
  };
}
