import type { BadgeTone } from '@/shared/ui/atoms';

/**
 * De `estadoVisible` al color del chip.
 *
 * Se mapea por string y no por el `estado` crudo porque "vencida" y "sin deuda"
 * no se guardan: se calculan. Lo que no este en la tabla cae en neutral, que es
 * preferible a romper la pantalla si el backend suma un estado visible nuevo.
 *
 * Vive en `shared` porque lo usan dos features: el listado de facturacion y la
 * ficha del cliente.
 */
const TONO_POR_ESTADO: Record<string, BadgeTone> = {
  abierta: 'primary',
  vencida: 'error',
  cerrada: 'warning',
  'sin deuda': 'success',
  pagada: 'success',
  anulada: 'neutral',
};

export const tonoEstadoFactura = (estadoVisible: string): BadgeTone =>
  TONO_POR_ESTADO[estadoVisible] ?? 'neutral';

/**
 * El plazo en una linea corta, para una fila de lista.
 *
 * `diasParaVencer` negativo son dias de atraso: -29 es "29 dias de atraso".
 */
export function textoVencimiento(diasParaVencer: number): string {
  if (diasParaVencer < 0) {
    const dias = Math.abs(diasParaVencer);
    return dias === 1 ? '1 dia de atraso' : `${dias} dias de atraso`;
  }
  if (diasParaVencer === 0) return 'Vence hoy';
  if (diasParaVencer === 1) return 'Vence manana';
  return `Vence en ${diasParaVencer} dias`;
}
