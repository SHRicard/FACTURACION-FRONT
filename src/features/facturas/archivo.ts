import type { FacturaDetalle } from './types';

/** "Ana López" → "ana-lopez": sin tildes ni espacios, que en un nombre de archivo molestan. */
function paraNombreDeArchivo(texto: string): string {
  const limpio = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return limpio || 'cliente';
}

/**
 * El nombre del PDF, como el que arma el backend en `Content-Disposition`: es
 * con el que le llega a quien lo recibe por WhatsApp o por mail.
 *   cerrada o pagada → factura-0012-ana-lopez.pdf
 *   abierta          → factura-en-curso-ana-lopez.pdf  (el backend suma la fecha)
 */
export function nombreArchivoFactura({ cliente, factura }: FacturaDetalle): string {
  const cual = factura.numero ? String(factura.numero).padStart(4, '0') : 'en-curso';
  return `factura-${cual}-${paraNombreDeArchivo(cliente.nombre)}.pdf`;
}
