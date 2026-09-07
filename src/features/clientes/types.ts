import type { z } from 'zod';

import type {
  clienteDetalleSchema,
  clienteEnListaSchema,
  clienteFormSchema,
  clienteSchema,
  estadoFacturaSchema,
  facturaAbiertaSchema,
  paginaClientesSchema,
  ventanaPagoSchema,
} from './schemas';

export type VentanaPago = z.infer<typeof ventanaPagoSchema>;
export type Cliente = z.infer<typeof clienteSchema>;
export type ClienteEnLista = z.infer<typeof clienteEnListaSchema>;
export type EstadoFactura = z.infer<typeof estadoFacturaSchema>;
export type FacturaAbierta = z.infer<typeof facturaAbiertaSchema>;
export type ClienteDetalle = z.infer<typeof clienteDetalleSchema>;
export type PaginaClientes = z.infer<typeof paginaClientesSchema>;
export type ClienteForm = z.infer<typeof clienteFormSchema>;

/** Lo que viaja al backend en el alta y en la edicion. */
export interface DatosCliente {
  nombre: string;
  dni: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  limiteCredito?: number;
  ventanaPago?: VentanaPago;
}

/** Filtros del listado. La pagina NO va aca: la maneja la query infinita. */
export interface FiltrosClientes {
  buscar?: string;
  /** Solo los que deben algo. */
  deudores?: boolean;
  /** Solo los que tienen alguna factura vencida. */
  vencidos?: boolean;
  porPagina?: number;
}
