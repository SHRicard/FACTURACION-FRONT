import { useCallback, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useDetalleEspecieQuery } from '../api/metricasApi';
import type { ClavePeriodo } from '../periodo';
import { usePeriodo } from './usePeriodo';

/**
 * El detalle de una especie: mes a mes, que talles y que articulos.
 *
 * Arranca con el periodo que se estaba mirando en el ranking: tocar "Media" en
 * "Ultimos 3 meses" tiene que abrir esos mismos 3 meses.
 */
export function useDetalleEspecie(especie: string, periodoInicial?: ClavePeriodo) {
  const periodo = usePeriodo(periodoInicial);
  /** El mes del grafico que se toco. */
  const [mesTocado, setMesTocado] = useState<string | null>(null);

  const consulta = useDetalleEspecieQuery(
    { especie, ...periodo.rango },
    { skip: !especie, refetchOnMountOrArgChange: true },
  );
  const { refetch } = consulta;

  /** Para el gesto de tirar para abajo. Devuelve la promesa a proposito. */
  const refrescar = useCallback(async () => {
    // Una query salteada no se puede re-pedir: RTK Query tira error.
    if (!especie) return;
    await refetch();
  }, [especie, refetch]);

  // Sin tocar nada se mira el ultimo mes, que es el que se viene a mirar.
  const porMes = consulta.data?.porMes ?? [];
  const mesElegido =
    porMes.find((mes) => mes.mes === mesTocado) ?? porMes[porMes.length - 1] ?? null;

  const error = interpretarError(consulta.error);

  return {
    datos: consulta.data,
    cargando: consulta.isLoading,
    /** Cambio el periodo y se esta pidiendo: lo de antes sigue en pantalla. */
    actualizando: consulta.isFetching && !consulta.isLoading,
    error: error?.mensaje ?? null,
    /** No existe, o es de otra marca. */
    noExiste: error?.status === 404,
    periodo: periodo.clave,
    setPeriodo: periodo.setClave,
    mesElegido,
    elegirMes: setMesTocado,
    refrescar,
    reintentar: refrescar,
  };
}
