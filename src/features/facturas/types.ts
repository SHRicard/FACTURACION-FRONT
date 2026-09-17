import type { z } from 'zod';

import type {
  bajaEnlacesSchema,
  clienteEnFacturaSchema,
  enlaceFacturaSchema,
  envioFacturaSchema,
  estadoFacturaSchema,
  facturaDetalleSchema,
  facturaEnListaSchema,
  facturaSchema,
  itemEnFacturaSchema,
  mailFacturaFormSchema,
  paginaFacturasSchema,
  ticketEnFacturaSchema,
} from './schemas';

/** La forma del pago es una sola y la define la feature de pagos. */
export type { Pago } from '@/features/pagos/types';

export type EstadoFactura = z.infer<typeof estadoFacturaSchema>;
export type ClienteEnFactura = z.infer<typeof clienteEnFacturaSchema>;
export type FacturaEnLista = z.infer<typeof facturaEnListaSchema>;
export type PaginaFacturas = z.infer<typeof paginaFacturasSchema>;
export type ItemEnFactura = z.infer<typeof itemEnFacturaSchema>;
export type TicketEnFactura = z.infer<typeof ticketEnFacturaSchema>;
export type FacturaDetalle = z.infer<typeof facturaDetalleSchema>;
export type Factura = z.infer<typeof facturaSchema>;
export type EnlaceFactura = z.infer<typeof enlaceFacturaSchema>;
export type EnvioFactura = z.infer<typeof envioFacturaSchema>;
export type BajaEnlaces = z.infer<typeof bajaEnlacesSchema>;
export type MailFacturaForm = z.infer<typeof mailFacturaFormSchema>;

/**
 * Filtros del listado. La pagina NO va aca: la maneja la query infinita.
 *
 * ⚠️ `vencidas` no es un estado: busca fecha pasada con saldo entre las
 * abiertas. Combinarlo con `estado: 'pagada'` no devuelve nada,
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
