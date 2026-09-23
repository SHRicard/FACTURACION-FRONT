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
 * La factura activa del cliente con los totales ya recalculados. Es siempre la
 * misma aunque este vencida: el ticket se suma a lo que ya debe.
 *
 * Los cinco totales son de la FACTURA ENTERA, no de este ticket. El que se
 * muestra es `saldo`.
 */
export const facturaTicketSchema = z
  .object({
    _id: z.string(),
    /** String y no enum: un estado nuevo del backend no rompe el ticket (K8). */
    estado: z.string(),
    estadoVisible: z.string(),
    venceEl: z.string(),
    /** null = sin compras: su fecha es provisoria (K3). */
    diasParaVencer: z.number().nullable(),
    cantidadTickets: z.number(),
    totalMercaderia: z.number(),
    totalPagadoEnTickets: z.number(),
    totalFiado: z.number(),
    totalPagos: z.number(),
    saldo: z.number(),
    /**
     * Si el próximo ticket vuelve a elegir el vencimiento: la primera compra, o
     * una compra fiada sobre una factura que quedó en $0 (K15). Opcional
     * mientras haya backs que no lo mandan.
     */
    eligeVencimiento: z.boolean().optional(),
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
  /**
   * true = ese ticket ya se había cargado con la misma clave (reintento); no
   * se volvió a cargar.
   */
  repetido: z.boolean().default(false),
});

/** Lo que devuelve la anulacion: el ticket tachado y la factura sin el. */
export const respuestaAnulacionSchema = z.object({
  mensaje: z.string(),
  ticket: ticketSchema,
  factura: facturaTicketSchema,
});

/**
 * Topes de un ticket. Son los mismos que valida el back (models/Ticket.ts
 * `LIMITES_TICKET`, K16): si cambian allá, cambian acá.
 */
export const LIMITES_TICKET = {
  renglones: 100,
  cantidad: 9999,
  precioUnitario: 100_000_000,
  total: 1_000_000_000,
} as const;

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
    .refine((valor) => Number(valor) >= 1, 'De 1 para arriba.')
    .refine((valor) => Number(valor) <= LIMITES_TICKET.cantidad, 'Hasta 9.999.'),
  precioUnitario: z
    .string()
    .regex(/^\d+$/, 'Poné el precio, solo números.')
    .refine(
      (valor) => Number(valor) <= LIMITES_TICKET.precioUnitario,
      'El precio va de $0 a $100.000.000.',
    ),
});

/** Lo que suma un renglon. Vale para el form (strings) y para el resumen. */
export const subtotalDe = (cantidad: string, precioUnitario: string): number =>
  (Number(cantidad) || 0) * (Number(precioUnitario) || 0);

export const ticketFormSchema = z
  .object({
    items: z
      .array(itemFormSchema)
      .min(1, 'El ticket necesita al menos un ítem.')
      .max(LIMITES_TICKET.renglones, 'Un ticket tiene hasta 100 artículos.'),
    /** Lo que deja en el momento. Vacio = se fia todo. */
    pagado: z.string().regex(/^\d*$/, 'Solo números, sin puntos.'),
    /**
     * La fecha que acordo con el cliente, `aaaa-mm-dd`. Vacio = sale de su
     * ventana de pago. Solo vale en el primer ticket de la factura.
     */
    venceEl: z.string(),
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

    // Se muestra bajo el último precio: es el que lo pasó del tope.
    if (total > LIMITES_TICKET.total) {
      ctx.addIssue({
        code: 'custom',
        path: ['items', datos.items.length - 1, 'precioUnitario'],
        message: 'El ticket no puede pasar de $1.000.000.000.',
      });
    }
  });
