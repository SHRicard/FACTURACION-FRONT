import type { z } from 'zod';

import type {
  METODOS_PAGO,
  entregaSchema,
  facturaTocadaSchema,
  pagoFormSchema,
  pagoSchema,
  respuestaAnulacionPagoSchema,
  respuestaPagoSchema,
  tipoPagoSchema,
} from './schemas';

export type MetodoPago = (typeof METODOS_PAGO)[number];
export type TipoPago = z.infer<typeof tipoPagoSchema>;
export type Pago = z.infer<typeof pagoSchema>;
export type Entrega = z.infer<typeof entregaSchema>;
export type FacturaTocada = z.infer<typeof facturaTocadaSchema>;
export type RespuestaPago = z.infer<typeof respuestaPagoSchema>;
export type RespuestaAnulacionPago = z.infer<typeof respuestaAnulacionPagoSchema>;
export type PagoForm = z.infer<typeof pagoFormSchema>;

/** Lo que viaja al backend, igual en las dos puertas. La fecha no se manda. */
export interface PagoNuevo {
  monto: number;
  metodoPago?: MetodoPago;
  nota?: string;
}
