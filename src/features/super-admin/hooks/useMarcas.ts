import { useCallback, useMemo, useState } from 'react';

import type { Opcion } from '@/features/metricas/types';
import { interpretarError } from '@/shared/utils';

import {
  useListarMarcasAdminInfiniteQuery,
  useRecalcularTodasLasMarcasMutation,
} from '../api/superAdminApi';
import type { MarcaEnListado, OrdenMarcas } from '../types';
import { useBusquedaDiferida } from './useBusquedaDiferida';

export type ActividadMarcas = 'todas' | 'activas' | 'inactivas';

export const ACTIVIDADES_MARCAS: readonly Opcion<ActividadMarcas>[] = [
  { clave: 'todas', etiqueta: 'Todas' },
  { clave: 'activas', etiqueta: 'Activas' },
  { clave: 'inactivas', etiqueta: 'Dormidas' },
];

export const ORDENES_MARCAS: readonly Opcion<OrdenMarcas>[] = [
  { clave: 'nombre', etiqueta: 'Nombre' },
  { clave: 'recientes', etiqueta: 'Más nuevas' },
  { clave: 'vendido', etiqueta: 'Más vendido' },
  { clave: 'cobrado', etiqueta: 'Más cobrado' },
  { clave: 'deuda', etiqueta: 'Más deuda' },
  { clave: 'clientes', etiqueta: 'Más clientes' },
];

/**
 * Listado de marcas: buscador, orden por plata o actividad, filtro de
 * actividad (ticket o pago en 30 dias) y el boton de soporte "Recalcular
 * todas".
 */
export function useMarcas() {
  const busqueda = useBusquedaDiferida();
  const [orden, setOrden] = useState<OrdenMarcas>('nombre');
  const [actividad, setActividad] = useState<ActividadMarcas>('todas');

  const consulta = useListarMarcasAdminInfiniteQuery({
    buscar: busqueda.aplicado,
    orden,
    actividad: actividad === 'todas' ? undefined : actividad,
  });
  const { data, refetch, fetchNextPage } = consulta;

  const marcas: MarcaEnListado[] = useMemo(
    () => (data?.pages ?? []).flatMap((pagina) => pagina.datos),
    [data],
  );

  const cargarMas = useCallback(() => {
    if (consulta.hasNextPage && !consulta.isFetchingNextPage) void fetchNextPage();
  }, [consulta.hasNextPage, consulta.isFetchingNextPage, fetchNextPage]);

  const refrescar = useCallback(async () => {
    await refetch({ refetchCachedPages: false });
  }, [refetch]);

  // ─── Recalcular todas ───
  const [confirmandoRecalculo, setConfirmandoRecalculo] = useState(false);
  const [avisoRecalculo, setAvisoRecalculo] = useState<string | null>(null);
  const [recalcular, estadoRecalculo] = useRecalcularTodasLasMarcasMutation();

  const recalcularTodas = useCallback(async () => {
    setAvisoRecalculo(null);
    try {
      const resultado = await recalcular().unwrap();
      const segundos = (resultado.milisegundos / 1000).toFixed(1);
      setAvisoRecalculo(
        resultado.fallidas.length > 0
          ? `Se recalcularon ${resultado.recalculadas}; fallaron ${resultado.fallidas.length}. Tardó ${segundos} s.`
          : `Listo: ${resultado.recalculadas} marcas recalculadas en ${segundos} s.`,
      );
      setConfirmandoRecalculo(false);
    } catch (fallo) {
      setAvisoRecalculo(interpretarError(fallo)?.mensaje ?? 'No pudimos recalcular.');
      setConfirmandoRecalculo(false);
    }
  }, [recalcular]);

  const { limpiar } = busqueda;

  return {
    marcas,
    total: data?.pages[0]?.total ?? 0,
    cargando: consulta.isLoading,
    cargandoMas: consulta.isFetchingNextPage,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    hayMas: consulta.hasNextPage,
    hayFiltros: busqueda.aplicado.trim() !== '' || actividad !== 'todas',
    buscar: busqueda.buscar,
    setBuscar: busqueda.setBuscar,
    orden,
    setOrden,
    actividad,
    setActividad,
    limpiarFiltros: useCallback(() => {
      limpiar();
      setActividad('todas');
    }, [limpiar]),
    cargarMas,
    refrescar,
    reintentar: refrescar,
    recalculo: {
      confirmando: confirmandoRecalculo,
      pedir: useCallback(() => setConfirmandoRecalculo(true), []),
      cancelar: useCallback(() => {
        if (!estadoRecalculo.isLoading) setConfirmandoRecalculo(false);
      }, [estadoRecalculo.isLoading]),
      confirmar: recalcularTodas,
      recalculando: estadoRecalculo.isLoading,
      aviso: avisoRecalculo,
      descartarAviso: useCallback(() => setAvisoRecalculo(null), []),
    },
  };
}
