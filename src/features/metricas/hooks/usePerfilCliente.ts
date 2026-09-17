import { useCallback, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { usePerfilClienteQuery } from '../api/metricasApi';

/**
 * Asi arranca el mensaje del 404 de una ruta que el backend no tiene. Un
 * cliente que no existe es otro 404 ("Cliente no encontrado"): el mensaje es lo
 * unico que los distingue.
 */
const RUTA_NO_ENCONTRADA = 'Ruta no encontrada';

/**
 * El perfil de un cliente: que tan confiable es y cuanto vale.
 *
 * Sin periodo: el cumplimiento de un cliente se juzga con TODAS sus facturas,
 * no con las de un rango (ver `docs/PERFIL_CLIENTE.md`).
 */
export function usePerfilCliente(id: string | undefined) {
  /** El mes del grafico que se toco. */
  const [mesTocado, setMesTocado] = useState<string | null>(null);

  const consulta = usePerfilClienteQuery(id ?? '', {
    skip: !id,
    refetchOnMountOrArgChange: true,
  });
  const { refetch } = consulta;

  /** Para el gesto de tirar para abajo. Devuelve la promesa a proposito. */
  const refrescar = useCallback(async () => {
    // Una query salteada no se puede re-pedir: RTK Query tira error.
    if (!id) return;
    await refetch();
  }, [id, refetch]);

  // Sin tocar nada se mira el ultimo mes, que es el mas reciente.
  const porMes = consulta.data?.cumplimiento.porMes ?? [];
  const mesElegido =
    porMes.find((mes) => mes.mes === mesTocado) ?? porMes[porMes.length - 1] ?? null;

  const error = interpretarError(consulta.error);
  const sinServicio = error?.status === 404 && error.mensaje.startsWith(RUTA_NO_ENCONTRADA);

  return {
    perfil: consulta.data ?? null,
    cargando: consulta.isLoading,
    error: error?.mensaje ?? null,
    /** El backend todavia no tiene el servicio (ver `docs/PERFIL_CLIENTE.md`). */
    sinServicio,
    /** El cliente no existe, o es de otra marca. */
    noExiste: error?.status === 404 && !sinServicio,
    mesElegido,
    elegirMes: setMesTocado,
    refrescar,
    reintentar: refrescar,
  };
}

/**
 * Cuanto se le podria subir el limite, o `null` si todavia no conviene.
 *
 * La regla es del front, no del backend (ver `docs/PERFIL_CLIENTE.md` §5): un
 * cliente que cumple muy bien y ya compro varias veces puede llevarse mas. Se
 * propone lo que sea mas alto entre vez y media su limite y tres tickets
 * promedio, redondeado hacia arriba a los $10.000 para que sea un numero
 * redondo de mostrador.
 */
const REDONDEO = 10000;

export function limiteSugerido(
  limiteActual: number,
  cumplimiento: { promedio: number | null; evaluadas: number },
  ticketPromedio: number | null,
): number | null {
  // Sin limite cargado no hay nada que subir, y con menos de tres facturas
  // juzgadas todavia no hay con que decidir.
  if (limiteActual <= 0 || cumplimiento.evaluadas < 3) return null;
  if (cumplimiento.promedio === null || cumplimiento.promedio < 90) return null;

  const propuesto = Math.max(limiteActual * 1.5, (ticketPromedio ?? 0) * 3);
  const redondeado = Math.ceil(propuesto / REDONDEO) * REDONDEO;
  return redondeado > limiteActual ? redondeado : null;
}
