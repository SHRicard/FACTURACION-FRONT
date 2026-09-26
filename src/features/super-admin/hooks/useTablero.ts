import { useCallback, useState } from 'react';

import type { Opcion } from '@/features/metricas/types';
import { interpretarError } from '@/shared/utils';

import { useCrecimientoQuery, useResumenPlataformaQuery } from '../api/superAdminApi';
import type { FiltrosCrecimiento } from '../types';

/** El selector del grafico: "30 días / 90 días / 12 meses" (docs/SUPER_ADMIN.md, 4). */
export type RangoCrecimiento = '30d' | '90d' | '12m';

export const RANGOS_CRECIMIENTO: readonly Opcion<RangoCrecimiento>[] = [
  { clave: '30d', etiqueta: '30 días' },
  { clave: '90d', etiqueta: '90 días' },
  { clave: '12m', etiqueta: '12 meses' },
];

const FILTROS_POR_RANGO: Record<RangoCrecimiento, FiltrosCrecimiento> = {
  '30d': { agrupar: 'dia', dias: 30 },
  '90d': { agrupar: 'dia', dias: 90 },
  '12m': { agrupar: 'mes', meses: 12 },
};

/**
 * El tablero del super_admin: los numeros de toda la plataforma
 * (`/admin/resumen`) y la serie del grafico (`/admin/crecimiento`).
 *
 * Son dos pedidos a proposito: cambiar el rango del grafico no vuelve a pedir
 * el resumen entero.
 */
export function useTablero() {
  const [rango, setRango] = useState<RangoCrecimiento>('30d');
  const resumen = useResumenPlataformaQuery();
  const crecimiento = useCrecimientoQuery(FILTROS_POR_RANGO[rango]);

  const { refetch: refetchResumen } = resumen;
  const { refetch: refetchCrecimiento } = crecimiento;

  const refrescar = useCallback(async () => {
    await Promise.allSettled([refetchResumen(), refetchCrecimiento()]);
  }, [refetchResumen, refetchCrecimiento]);

  return {
    resumen: resumen.data ?? null,
    cargando: resumen.isLoading,
    error: interpretarError(resumen.error)?.mensaje ?? null,
    crecimiento: crecimiento.data ?? null,
    /** Cambiar el rango trae otra serie: el grafico muestra su propia rueda. */
    cargandoCrecimiento: crecimiento.isFetching,
    errorCrecimiento: interpretarError(crecimiento.error)?.mensaje ?? null,
    rango,
    setRango,
    refrescar,
    reintentar: refrescar,
  };
}
