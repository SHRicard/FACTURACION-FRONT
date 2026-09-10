import type { z } from 'zod';

import type {
  facturaTicketSchema,
  respuestaAnulacionSchema,
  itemFormSchema,
  itemTicketSchema,
  respuestaTicketSchema,
  ticketFormSchema,
  ticketSchema,
} from './schemas';

export type ItemTicket = z.infer<typeof itemTicketSchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type FacturaTicket = z.infer<typeof facturaTicketSchema>;
export type RespuestaTicket = z.infer<typeof respuestaTicketSchema>;
export type RespuestaAnulacion = z.infer<typeof respuestaAnulacionSchema>;
export type ItemForm = z.infer<typeof itemFormSchema>;
export type TicketForm = z.infer<typeof ticketFormSchema>;

/** Un renglon como viaja al backend. */
export interface ItemNuevo {
  nombre: string;
  talle?: string;
  /** Id de una especie del negocio. */
  especie: string;
  cantidad?: number;
  precioUnitario: number;
}

export interface TicketNuevo {
  items: ItemNuevo[];
  /** Lo que deja en el momento. 0 = se fia todo. */
  pagado?: number;
}
