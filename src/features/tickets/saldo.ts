/** A centavos, como el back: sin esto 0.1 + 0.2 deja un excedente fantasma. */
const redondearPesos = (n: number) => Math.round(n * 100) / 100;

/**
 * Cuánto quedaría en negativo la factura si se corrige o se anula un ticket.
 *
 * Es la misma cuenta que `exigirSaldoNoNegativo` del back (K2): lo fiado que
 * queda (sale el faltante viejo del ticket, entra el nuevo) contra lo que el
 * cliente ya dejó a cuenta. Mayor que 0 significa que la factura quedaría en
 * negativo, y como no hay saldo a favor el back responde 400 SALDO_NEGATIVO.
 * Un saldo exactamente 0 está permitido: la factura se salda como siempre.
 *
 * Pura y sin imports, para poder probarla sola.
 */
export function excedenteDePagos(
  factura: { totalFiado: number; totalPagos: number },
  cambio: { sale: number; entra: number },
): number {
  if (factura.totalPagos <= 0) return 0;
  const fiado = redondearPesos(factura.totalFiado - cambio.sale + cambio.entra);
  return Math.max(0, redondearPesos(factura.totalPagos - fiado));
}
