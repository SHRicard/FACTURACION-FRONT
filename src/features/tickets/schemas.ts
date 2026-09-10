import { z } from 'zod';

/** Mongo llama `_id` a la clave primaria. Se renombra en esta capa y nada mas. */
const aId = <T extends { _id: string }>({ _id, ...resto }: T) => ({ id: _id, ...resto });

/**
 * Un renglon como VUELVE del backend: con el subtotal calculado y el nombre de
 * la especie ya copiado adentro, para poder mostrarlo sin buscar nada.
 */
export const itemTicketSchema = z.object({
  nombre: z.string(),
  talle: z.string().optional(),
  especie: z.string(),
  especieNombre: z.string(),
  cantidad: z.number(),
  precioUnitario: z.number(),
  subtotal: z.number(),
});

export const ticketSchema = z
  .object({
    _id: z.string(),
    factura: z.string(),
    cliente: z.string(),
    fecha: z.string(),
    items: z.array(itemTicketSchema),
    total: z.number(),
    pagado: z.number(),
    /** `total - pagado`: lo que se anoto en la cuenta. Lo calcula el backend. */
    faltante: z.number(),
    /**
     * Baja logica. Un ticket anulado CONSERVA sus numeros —son lo que se anoto
     * ese dia— pero la factura lo saltea al recalcular. No desaparece de las
     * listas: queda tachado, porque en una libreta lo que se escribio mal se
     * cruza con una raya, no se arranca la hoja.
     *
     * Con default porque las respuestas del alta y la edicion no lo mandan: un
     * ticket recien guardado nunca esta anulado.
     */
    anulado: z.boolean().default(false),
    anuladoEl: z.string().nullish(),
    motivoAnulacion: z.string().nullish(),
  })
  .transform(aId);

/**
 * La factura del periodo con los totales ya recalculados.
 *
 * Los cinco totales son del PERIODO ENTERO, no de este ticket. El que se
 * muestra es `saldo`.
 */
export const facturaTicketSchema = z
  .object({
    _id: z.string(),
    estado: z.enum(['abierta', 'cerrada', 'pagada', 'anulada']),
    estadoVisible: z.string(),
    venceEl: z.string(),
    diasParaVencer: z.number(),
    cantidadTickets: z.number(),
    totalMercaderia: z.number(),
    totalPagadoEnTickets: z.number(),
    totalFiado: z.number(),
    totalPagos: z.number(),
    saldo: z.number(),
  })
  .transform(aId);

/**
 * Lo que devuelve el alta. Trae las tres cosas que necesita la pantalla: el
 * ticket, la factura con el saldo al dia y el aviso de limite si corresponde.
 */
export const respuestaTicketSchema = z.object({
  ticket: ticketSchema,
  factura: facturaTicketSchema,
  /** Aviso de limite de credito. El ticket se guardo IGUAL: no es un error. */
  warning: z.string().nullable().default(null),
});

/** Lo que devuelve la anulacion: el ticket tachado y la factura sin el. */
export const respuestaAnulacionSchema = z.object({
  mensaje: z.string(),
  ticket: ticketSchema,
  factura: facturaTicketSchema,
});

/**
 * Un renglon del formulario.
 *
 * Cantidad y precio se guardan como string (es lo que da un TextInput) y se
 * convierten al armar el body: mantenerlos como number obligaria a manejar el
 * NaN del campo vacio en cada tecla.
 */
export const itemFormSchema = z.object({
  nombre: z.string().trim().min(1, 'Poné qué se lleva.'),
  talle: z.string().trim(),
  especie: z.string().min(1, 'Elegí la especie.'),
  cantidad: z
    .string()
    .regex(/^\d+$/, 'La cantidad va entera.')
    .refine((valor) => Number(valor) >= 1, 'De 1 para arriba.'),
  precioUnitario: z.string().regex(/^\d+$/, 'Poné el precio, solo números.'),
});

/** Lo que suma un renglon. Vale para el form (strings) y para el resumen. */
export const subtotalDe = (cantidad: string, precioUnitario: string): number =>
  (Number(cantidad) || 0) * (Number(precioUnitario) || 0);

export const ticketFormSchema = z
  .object({
    items: z.array(itemFormSchema).min(1, 'El ticket necesita al menos un ítem.'),
    /** Lo que deja en el momento. Vacio = se fia todo. */
    pagado: z.string().regex(/^\d*$/, 'Solo números, sin puntos.'),
  })
  .superRefine((datos, ctx) => {
    const total = datos.items.reduce(
      (suma, item) => suma + subtotalDe(item.cantidad, item.precioUnitario),
      0,
    );

    // El backend lo rechaza con un 400, pero se ve mucho mejor debajo del campo
    // mientras se escribe que en un cartel despues de tocar guardar.
    if (Number(datos.pagado || 0) > total) {
      ctx.addIssue({
        code: 'custom',
        path: ['pagado'],
        message: 'Está dejando más de lo que suma el ticket.',
      });
    }
  });
