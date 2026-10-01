import { useCallback } from 'react';

import { interpretarError } from '@/shared/utils';

import { useDocumentoLegalQuery } from '../api/legalApi';
import type { TipoDocumento } from '../types';

/**
 * Un documento legal, listo para dibujar.
 *
 * Es la misma consulta para los tres documentos: cambia el `tipo` y nada mas.
 * Por eso hay UNA pantalla parametrizada y no tres copias.
 */
export function useDocumentoLegal(tipo: TipoDocumento) {
  const consulta = useDocumentoLegalQuery(tipo);
  const { refetch } = consulta;

  // Depende de `refetch` y no de `consulta`: el objeto de la consulta es nuevo
  // en cada render, y arrastraria a recrear el RefreshControl entero.
  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    documento: consulta.data ?? null,
    cargando: consulta.isLoading,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    refrescar,
    reintentar: refrescar,
  };
}
