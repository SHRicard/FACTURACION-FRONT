import { DateTime } from 'luxon';

/**
 * Formateadores para mostrar datos. Viven aca y no en cada pantalla para que
 * un monto se vea igual en el listado, en el detalle y en el comprobante.
 */

const MONEDA = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  // Los montos de facturacion son enteros en la practica; los centavos solo
  // suman ruido en una fila de lista.
  maximumFractionDigits: 0,
});

/** `18000` -> `$ 18.000`. */
export function formatearMoneda(monto: number): string {
  return MONEDA.format(monto);
}

/** `'2026-09-11T02:59:59.999Z'` -> `'11 de septiembre de 2026'`. */
export function formatearFecha(iso?: string | null): string | null {
  if (!iso) return null;
  const fecha = DateTime.fromISO(iso).setLocale('es');
  return fecha.isValid ? fecha.toFormat("d 'de' LLLL 'de' yyyy") : null;
}

/** `'2026-09-11T02:59:59.999Z'` -> `'11/09/2026'`. Para tablas y chips. */
export function formatearFechaCorta(iso?: string | null): string | null {
  if (!iso) return null;
  const fecha = DateTime.fromISO(iso).setLocale('es');
  return fecha.isValid ? fecha.toFormat('dd/LL/yyyy') : null;
}

/**
 * Como se lee una ventana de pago: `{ 1, 10 }` -> `'del 1 al 10'`.
 *
 * Un solo dia (`{ 5, 5 }`) se dice distinto: "del 5 al 5" suena a error.
 */
export function formatearVentanaPago(desdeDia: number, hastaDia: number): string {
  return desdeDia === hastaDia ? `el ${desdeDia}` : `del ${desdeDia} al ${hastaDia}`;
}
