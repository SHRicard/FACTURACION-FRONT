import type { z } from 'zod';

import type {
  clienteEnFacturaSchema,
  estadoFacturaSchema,
  facturaDetalleSchema,
  facturaEnListaSchema,
  itemEnFacturaSchema,
  pagoSchema,
  paginaFacturasSchema,
  ticketEnFacturaSchema,
} from './schemas';

export type EstadoFactura = z.infer<typeof estadoFacturaSchema>;
export type ClienteEnFactura = z.infer<typeof clienteEnFacturaSchema>;
export type FacturaEnLista = z.infer<typeof facturaEnListaSchema>;
export type PaginaFacturas = z.infer<typeof paginaFacturasSchema>;
export type ItemEnFactura = z.infer<typeof itemEnFacturaSchema>;
export type TicketEnFactura = z.infer<typeof ticketEnFacturaSchema>;
export type Pago = z.infer<typeof pagoSchema>;
export type FacturaDetalle = z.infer<typeof facturaDetalleSchema>;

/**
 * Filtros del listado. La pagina NO va aca: la maneja la query infinita.
 *
 * ⚠️ `vencidas` no es un estado: busca fecha pasada con saldo entre las
 * abiertas y las cerradas. Combinarlo con `estado: 'pagada'` no devuelve nada,
 * porque una pagada no tiene saldo. Por eso los filtros de la pantalla son
 * excluyentes entre si.
 */
export interface FiltrosFacturas {
  estado?: EstadoFactura;
  cliente?: string;
  vencidas?: boolean;
  buscar?: string;
  porPagina?: number;
}
