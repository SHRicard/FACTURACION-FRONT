import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useDetalleErrorAppInfiniteQuery, useResolverErrorAppMutation } from '../api/superAdminApi';
import { volverAlListado } from '../navegar';
import type { OcurrenciaError } from '../types';

/**
 * El detalle mira los 30 dias enteros: es todo lo que guarda Mongo, y con
 * menos un grupo que se ve en el listado podria responder 404.
 */
const DIAS_DETALLE = 30;

/**
 * Un grupo de errores con cada vez que paso (paginadas), y "Marcar resuelto":
 * borra todos sus reportes. Si vuelve a pasar, reaparece como nuevo.
 */
export function useErrorApp(huella: string | undefined) {
  const router = useRouter();
  const consulta = useDetalleErrorAppInfiniteQuery(
    { huella: huella ?? '', filtros: { dias: DIAS_DETALLE } },
    { skip: !huella },
  );
  const { data, refetch, fetchNextPage } = consulta;

  const ocurrencias: OcurrenciaError[] = useMemo(
    () => (data?.pages ?? []).flatMap((pagina) => pagina.ocurrencias.datos),
    [data],
  );

  const cargarMas = useCallback(() => {
    if (consulta.hasNextPage && !consulta.isFetchingNextPage) void fetchNextPage();
  }, [consulta.hasNextPage, consulta.isFetchingNextPage, fetchNextPage]);

  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // ─── Marcar resuelto ───
  const [confirmando, setConfirmando] = useState(false);
  const [errorResolver, setErrorResolver] = useState<string | null>(null);
  const [resolver, estadoResolver] = useResolverErrorAppMutation();

  const confirmarResuelto = useCallback(async () => {
    if (!huella) return;
    setErrorResolver(null);
    try {
      await resolver(huella).unwrap();
      setConfirmando(false);
      volverAlListado(router, '/super-admin/errores');
    } catch (fallo) {
      setErrorResolver(interpretarError(fallo)?.mensaje ?? 'No pudimos marcarlo como resuelto.');
    }
  }, [huella, resolver, router]);

  const detalleError = interpretarError(consulta.error);
  const primera = data?.pages[0];

  return {
    grupo: primera?.grupo ?? null,
    dias: primera?.dias ?? DIAS_DETALLE,
    ocurrencias,
    totalOcurrencias: primera?.ocurrencias.total ?? 0,
    cargando: consulta.isLoading,
    cargandoMas: consulta.isFetchingNextPage,
    hayMas: consulta.hasNextPage,
    error: detalleError?.mensaje ?? null,
    /** 404: no hay reportes de esa huella en el lapso (o ya se resolvio). */
    noExiste: detalleError?.status === 404,
    cargarMas,
    refrescar,
    reintentar: refrescar,
    resolver: {
      confirmando,
      pedir: useCallback(() => {
        setErrorResolver(null);
        setConfirmando(true);
      }, []),
      cancelar: useCallback(() => {
        if (!estadoResolver.isLoading) setConfirmando(false);
      }, [estadoResolver.isLoading]),
      confirmar: confirmarResuelto,
      enviando: estadoResolver.isLoading,
      error: errorResolver,
    },
  };
}
