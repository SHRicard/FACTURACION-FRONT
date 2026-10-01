import type { ImperativeRouter } from 'expo-router';

/**
 * Lleva a la factura del ticket. Es el acceso para anular el pago que impide
 * achicar o anular el ticket (K2, SALDO_NEGATIVO).
 *
 * Si se llegó al ticket desde la factura, la factura está justo atrás: se
 * vuelve en vez de apilar una copia. Si no, se entra al tab Facturas con
 * `withAnchor`, para que la lista quede debajo y "atrás" no caiga en otro tab.
 */
export function irALaFactura(
  router: ImperativeRouter,
  facturaId: string,
  desdeFactura: boolean,
): void {
  if (desdeFactura && router.canGoBack()) {
    router.back();
    return;
  }
  router.push(`/admin/facturas/${facturaId}`, { withAnchor: true });
}
