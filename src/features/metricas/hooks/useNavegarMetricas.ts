import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import type { ClavePeriodo } from '../periodo';

/**
 * A donde llevan los renglones de una metrica: el perfil del cliente, su
 * historial, su ficha, la factura o el detalle de una especie.
 *
 * El perfil y el historial viven en el stack de Mas, asi que "atras" vuelve a
 * la metrica. La ficha y la factura viven en otro tab: `withAnchor` deja la
 * lista de ese tab debajo, para que "atras" no caiga en el Dashboard. Ver el
 * layout de Clientes.
 */
export function useNavegarMetricas() {
  const router = useRouter();

  const irAlCliente = useCallback(
    (id: string) => router.push(`/admin/clientes/${id}`, { withAnchor: true }),
    [router],
  );

  /**
   * El perfil: que tan confiable es y cuanto vale. `volver` es lo que dice la
   * flecha ("Mejores").
   */
  const irAlPerfil = useCallback(
    (id: string, volver: string) =>
      router.push({
        pathname: '/admin/cuenta/metricas/cliente/[id]/perfil',
        params: { id, volver },
      }),
    [router],
  );

  /** El historial completo: todo lo que compro y pago, movimiento por movimiento. */
  const irAlHistorial = useCallback(
    (id: string, volver: string) =>
      router.push({ pathname: '/admin/cuenta/metricas/cliente/[id]', params: { id, volver } }),
    [router],
  );

  const irALaFactura = useCallback(
    (id: string) => router.push(`/admin/facturas/${id}`, { withAnchor: true }),
    [router],
  );

  /** El detalle de una especie: mismo stack, y el periodo que se estaba mirando. */
  const irALaEspecie = useCallback(
    (especie: string, periodo: ClavePeriodo) =>
      router.push({
        pathname: '/admin/cuenta/metricas/ventas-por-especie/[especie]',
        params: { especie, periodo },
      }),
    [router],
  );

  return { irAlCliente, irAlPerfil, irAlHistorial, irALaFactura, irALaEspecie };
}
