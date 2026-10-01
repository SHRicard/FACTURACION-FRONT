import { useCallback, useMemo, useState } from 'react';

import type { Opcion } from '@/features/metricas/types';
import { interpretarError } from '@/shared/utils';

import { useListarErroresAppInfiniteQuery } from '../api/superAdminApi';
import type { FiltrosErrores, GrupoError } from '../types';
import { useBusquedaDiferida } from './useBusquedaDiferida';

/** Mongo borra cada reporte a los 30 dias: no se puede mirar mas atras. */
export const DIAS_ERRORES: readonly Opcion<number>[] = [
  { clave: 1, etiqueta: '24 h' },
  { clave: 7, etiqueta: '7 días' },
  { clave: 30, etiqueta: '30 días' },
];

export type OrdenErrores = NonNullable<FiltrosErrores['orden']>;

export const ORDENES_ERRORES: readonly Opcion<OrdenErrores>[] = [
  { clave: 'recientes', etiqueta: 'Recientes' },
  { clave: 'frecuentes', etiqueta: 'Frecuentes' },
];

export type PlataformaFiltro = 'todas' | NonNullable<FiltrosErrores['plataforma']>;

export const PLATAFORMAS_ERRORES: readonly Opcion<PlataformaFiltro>[] = [
  { clave: 'todas', etiqueta: 'Todas' },
  { clave: 'android', etiqueta: 'Android' },
  { clave: 'ios', etiqueta: 'iOS' },
  { clave: 'web', etiqueta: 'Web' },
];

/**
 * Los errores que reporto la app, agrupados por huella: el mismo error en 100
 * telefonos es un renglon con `cantidad: 100`.
 */
export function useErrores() {
  const busqueda = useBusquedaDiferida();
  const [dias, setDias] = useState(7);
  const [orden, setOrden] = useState<OrdenErrores>('recientes');
  const [plataforma, setPlataforma] = useState<PlataformaFiltro>('todas');
  const [soloFatales, setSoloFatales] = useState(false);

  const consulta = useListarErroresAppInfiniteQuery({
    buscar: busqueda.aplicado,
    dias,
    orden,
    plataforma: plataforma === 'todas' ? undefined : plataforma,
    fatal: soloFatales ? true : undefined,
  });
  const { data, refetch, fetchNextPage } = consulta;

  const grupos: GrupoError[] = useMemo(
    () => (data?.pages ?? []).flatMap((pagina) => pagina.datos),
    [data],
  );

  const cargarMas = useCallback(() => {
    if (consulta.hasNextPage && !consulta.isFetchingNextPage) void fetchNextPage();
  }, [consulta.hasNextPage, consulta.isFetchingNextPage, fetchNextPage]);

  const refrescar = useCallback(async () => {
    await refetch({ refetchCachedPages: false });
  }, [refetch]);

  const { limpiar } = busqueda;
  const primera = data?.pages[0];

  return {
    grupos,
    /** Cuantos errores DISTINTOS, y cuantas veces pasaron en total. */
    total: primera?.total ?? 0,
    ocurrencias: primera?.ocurrencias ?? 0,
    cargando: consulta.isLoading,
    cargandoMas: consulta.isFetchingNextPage,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    hayMas: consulta.hasNextPage,
    hayFiltros: busqueda.aplicado.trim() !== '' || plataforma !== 'todas' || soloFatales,
    buscar: busqueda.buscar,
    setBuscar: busqueda.setBuscar,
    dias,
    setDias,
    orden,
    setOrden,
    plataforma,
    setPlataforma,
    soloFatales,
    alternarFatales: useCallback(() => setSoloFatales((valor) => !valor), []),
    limpiarFiltros: useCallback(() => {
      limpiar();
      setPlataforma('todas');
      setSoloFatales(false);
    }, [limpiar]),
    cargarMas,
    refrescar,
    reintentar: refrescar,
  };
}
