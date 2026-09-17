import { formatearCumplimiento, formatearMoneda } from '@/shared/utils';

import { METODOS_PAGO } from './schemas';
import type { FacturaTocada, MetodoPago, Pago } from './types';

export const NOMBRE_METODO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
};

/**
 * Metodos que ya no se ofrecen pero el backend acepta: un pago viejo cargado
 * asi se sigue leyendo con su nombre en el historial.
 */
const NOMBRE_METODO_HISTORICO: Record<string, string> = {
  mercadopago: 'Mercado Pago',
  otro: 'Otro',
};

const esMetodoPago = (valor: string): valor is MetodoPago =>
  (METODOS_PAGO as readonly string[]).includes(valor);

/**
 * El nombre del metodo para mostrar. Sin metodo es efectivo (el default del
 * backend); uno desconocido se muestra tal cual antes que inventarle un nombre.
 */
export function nombreMetodo(metodo?: string | null): string {
  if (!metodo) return NOMBRE_METODO.efectivo;
  if (esMetodoPago(metodo)) return NOMBRE_METODO[metodo];
  return NOMBRE_METODO_HISTORICO[metodo] ?? metodo;
}

/**
 * "debia $41.000 · quedo $21.000", o null en un pago viejo sin recibo.
 *
 * Es una FOTO del momento del pago: si despues se le pega otro ticket a la
 * factura, el pago sigue diciendo lo de ese dia. El saldo actual es otro dato.
 */
export function textoRecibo(pago: Pago): string | null {
  if (pago.saldoAnterior == null || pago.saldoPosterior == null) return null;
  return `debía ${formatearMoneda(pago.saldoAnterior)} · quedó ${formatearMoneda(pago.saldoPosterior)}`;
}

/**
 * Si la plata de este pago se repartio entre varias facturas. Solo pasa en
 * pagos de antes del cambio: ahora el cliente tiene una sola factura con deuda.
 */
export const fueRepartido = (pago: Pago): boolean =>
  pago.montoEntrega != null && pago.montoEntrega > pago.monto;

/** Quien lo cobro. Solo viene con nombre en el detalle de la factura. */
export function quienCobro(pago: Pago): string | null {
  const { registradoPor } = pago;
  return registradoPor && typeof registradoPor === 'object' ? registradoPor.nombre : null;
}

/** "N° 0012" si ya tiene numero; si no, es la factura en curso: se numera al saldarla. */
export const etiquetaFactura = (numero?: number | null): string =>
  numero ? `N° ${String(numero).padStart(4, '0')}` : 'Factura en curso';

/** "Factura N° 0001 saldada · 90% de cumplimiento": el pago que la dejo en cero. */
export function textoFacturaSaldada(factura: FacturaTocada): string {
  const nombre = factura.numero ? `Factura ${etiquetaFactura(factura.numero)}` : 'Factura';
  const cumplimiento =
    factura.cumplimiento == null
      ? ''
      : ` · ${formatearCumplimiento(factura.cumplimiento)} de cumplimiento`;
  return `${nombre} saldada${cumplimiento}`;
}
