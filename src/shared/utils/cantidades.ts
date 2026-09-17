/**
 * Cantidades y dias en texto: "3 clientes", "26,5 días", "hace 105 días".
 *
 * Viven en `shared` porque los usan dos features: las metricas y el historial
 * del cliente.
 */

const ENTERO = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const UN_DECIMAL = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

/** `1600` -> `1.600`. Para unidades y conteos. */
export function formatearCantidad(valor: number): string {
  return ENTERO.format(valor);
}

/** Singular o plural segun la cantidad: `1 cliente`, `3 clientes`. */
export function contar(cantidad: number, singular: string, plural: string): string {
  return `${formatearCantidad(cantidad)} ${cantidad === 1 ? singular : plural}`;
}

/** `1` -> `1 día`, `26.5` -> `26,5 días`. */
export function textoDias(dias: number): string {
  return dias === 1 ? '1 día' : `${UN_DECIMAL.format(dias)} días`;
}

/** `0` -> `hoy`, `1` -> `ayer`, `105` -> `hace 105 días`. */
export function haceDias(dias: number): string {
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  return `hace ${textoDias(dias)}`;
}
