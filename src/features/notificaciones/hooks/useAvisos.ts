import { useCallback } from 'react';
import { Linking } from 'react-native';

import { interpretarError } from '@/shared/utils';

import { useAvisosAppQuery } from '../api/notificacionesApi';

/** La lista de avisos de la app: mantenimientos, novedades, versiones. */
export function useAvisos() {
  const consulta = useAvisosAppQuery();
  const { refetch } = consulta;

  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  /** "Actualizar" en un aviso de version nueva. */
  const abrirTienda = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  return {
    avisos: consulta.data?.datos ?? [],
    cargando: consulta.isLoading,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    refrescar,
    reintentar: refrescar,
    abrirTienda,
  };
}
