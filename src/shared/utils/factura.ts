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
  'sin deuda': 'success',
  pagada: 'success',
  anulada: 'neutral',
  // Factura abierta sin tickets: no es deuda ni está vencida (K3).
  'sin compras': 'neutral',
};

export const tonoEstadoFactura = (estadoVisible: string): BadgeTone =>
  TONO_POR_ESTADO[estadoVisible] ?? 'neutral';

/**
 * El plazo en una linea corta, para una fila de lista.
 *
 * `diasParaVencer` negativo son dias de atraso: -29 es "29 dias de atraso".
 * `null` es una factura sin compras (K3): su fecha es provisoria, asi que no
 * se habla de plazo.
 */
export function textoVencimiento(diasParaVencer: number | null): string {
  if (diasParaVencer === null) return 'Sin compras todavía';
  if (diasParaVencer < 0) {
    const dias = Math.abs(diasParaVencer);
    return dias === 1 ? '1 dia de atraso' : `${dias} dias de atraso`;
  }
  if (diasParaVencer === 0) return 'Vence hoy';
  if (diasParaVencer === 1) return 'Vence manana';
  return `Vence en ${diasParaVencer} dias`;
}

// ─────────────────── Cumplimiento ───────────────────

const UN_DECIMAL = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

/**
 * `90` -> `90%`, `67.5` -> `67,5%`. `null` -> `—`: sin nada fiado no hay que
 * medir, y un `0%` se leeria como "no pago nada".
 */
export function formatearCumplimiento(valor: number | null | undefined): string {
  return valor == null ? '—' : `${UN_DECIMAL.format(valor)}%`;
}

/** El color del cumplimiento: 90 o mas verde, de 60 a 89 ambar, menos rojo. */
export function tonoCumplimiento(valor: number | null | undefined): BadgeTone {
  if (valor == null) return 'neutral';
  if (valor >= 90) return 'success';
  if (valor >= 60) return 'warning';
  return 'error';
}

interface FacturaConCumplimiento {
  estado: string;
  vencida?: boolean;
  cumplimiento?: number | null;
}

/**
 * El chip de cumplimiento de una factura, o null si no corresponde mostrarlo.
 *
 * Solo se juzga la saldada (queda fijo) y la vencida (va cambiando con cada
 * pago). Una abierta que todavia no vencio trae 0 porque no pago nada, pero
 * esta a tiempo: mostrarle "0%" seria acusarla de algo que no hizo.
 *
 * Vive en `shared` porque lo usan el listado, el detalle y el comprobante del
 * pago, que son de features distintas.
 */
export function chipCumplimiento(
  factura: FacturaConCumplimiento,
): { label: string; tone: BadgeTone } | null {
  if (factura.cumplimiento == null) return null;
  if (factura.estado === 'pagada') {
    return {
      label: `${formatearCumplimiento(factura.cumplimiento)} de cumplimiento`,
      tone: tonoCumplimiento(factura.cumplimiento),
    };
  }
  if (factura.vencida) {
    return {
      label: `Cumplimiento: va ${formatearCumplimiento(factura.cumplimiento)}`,
      tone: tonoCumplimiento(factura.cumplimiento),
    };
  }
  return null;
}
