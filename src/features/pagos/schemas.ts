import { z } from 'zod';

/** Mongo llama `_id` a la clave primaria. Se renombra en esta capa y nada mas. */
const aId = <T extends { _id: string }>({ _id, ...resto }: T) => ({ id: _id, ...resto });

/**
 * Los metodos que se OFRECEN al cobrar. En el negocio se paga en efectivo o por
 * transferencia y nada mas: el backend acepta tambien `mercadopago` y `otro`,
 * pero no se muestran para no hacer elegir entre opciones que no se usan.
 * Vacio en el body = `efectivo`.
 */
export const METODOS_PAGO = ['efectivo', 'transferencia'] as const;
export const metodoPagoSchema = z.enum(METODOS_PAGO);

/** Derivado por el backend: `completo` si el saldo quedo en cero. */
export const tipoPagoSchema = z.enum(['completo', 'parcial']);

/**
 * Un pago: lo que descontó de UNA factura.
 *
 * Casi todo va opcional a proposito:
 * - Los pagos cargados antes del recibo no traen `entrega`, `montoEntrega` ni
 *   los saldos, y vienen con `tipo: null`. La pantalla tiene que aguantarlo.
 * - `registradoPor` viene con nombre en el detalle de la factura y como id
 *   pelado en las respuestas del alta.
 * - `metodoPago` va como string y no como enum: un pago viejo con un metodo que
 *   ya no existe no puede romper la factura entera con un error de Zod.
 */
export const pagoSchema = z
  .object({
    _id: z.string(),
    factura: z.string().optional(),
    fecha: z.string(),
    /** Lo que descontó de ESTA factura. Es el numero del renglon. */
    monto: z.number(),
    metodoPago: z.string().optional(),
    nota: z.string().nullish(),
    entrega: z.string().nullish(),
    /** Lo que dejo en total esa vez. Mayor que `monto` = la plata se repartio. */
    montoEntrega: z.number().nullish(),
    /** Foto del momento del pago, como un recibo de papel. */
    saldoAnterior: z.number().nullish(),
    saldoPosterior: z.number().nullish(),
    // Un tipo nuevo del backend se lee como "sin tipo", igual que los pagos
    // viejos, en vez de romper la factura (K8).
    tipo: tipoPagoSchema.nullish().catch(null),
    registradoPor: z
      .union([z.string(), z.object({ _id: z.string(), nombre: z.string() })])
      .nullish(),
    anulado: z.boolean().default(false),
    anuladoEl: z.string().nullish(),
    motivoAnulacion: z.string().nullish(),
  })
  .transform(aId);

/**
 * La entrega: la plata que el cliente dejo ESA vez. Es el comprobante que se
 * muestra despues de guardar.
 *
 * Los saldos cambian de significado segun la puerta: en el pago del cliente son
 * la deuda TOTAL; en el pago a una factura, el saldo de esa factura.
 */
export const entregaSchema = z
  .object({
    _id: z.string(),
    fecha: z.string(),
    monto: z.number(),
    metodoPago: z.string().optional(),
    nota: z.string().nullish(),
    saldoAnterior: z.number(),
    saldoPosterior: z.number(),
    /**
     * String y no `tipoPagoSchema`: es la etiqueta del Badge del comprobante y
     * solo se compara con 'completo'. Un tipo nuevo se muestra tal cual en vez
     * de romper el comprobante (K8).
     */
    tipo: z.string(),
    cantidadFacturas: z.number(),
  })
  .transform(aId);

/**
 * Una factura que toco el pago, ya recalculada.
 *
 * Schema propio y liviano, y no el de `facturas`: asi esta feature no depende de
 * la otra (que ya depende de esta por `pagoSchema`) y no se arma un ciclo.
 */
export const facturaTocadaSchema = z
  .object({
    _id: z.string(),
    /** Se asigna al saldarla: la activa llega sin numero o con null. */
    numero: z.number().nullish(),
    /** `pagada` = este pago la dejo en cero y la cerro. */
    estado: z.string(),
    estadoVisible: z.string().optional(),
    saldo: z.number(),
    porcentajeCobrado: z.number().optional(),
    pagadaEl: z.string().nullish(),
    /** De 0 a 100. En la que se acaba de saldar, queda fijo. */
    cumplimiento: z.number().nullish(),
  })
  .transform(aId);

/** Misma forma para las dos puertas: a cuenta del cliente o a una factura. */
export const respuestaPagoSchema = z.object({
  entrega: entregaSchema,
  pagos: z.array(pagoSchema),
  facturas: z.array(facturaTocadaSchema),
  /** Lo que debe el cliente ahora, sumando todas sus facturas. */
  deudaTotal: z.number(),
  /**
   * true = ese cobro ya se había registrado con la misma clave (reintento con
   * mala señal); no se volvió a registrar (K1).
   */
  repetido: z.boolean().default(false),
});

export const respuestaAnulacionPagoSchema = z.object({
  mensaje: z.string(),
  pagos: z.array(pagoSchema),
  facturas: z.array(facturaTocadaSchema),
  deudaTotal: z.number(),
});

/**
 * El tope de un cobro. Es el mismo que valida el back (services/pagos.ts,
 * `leerDatosPago`, K16): si cambia alla, cambia aca.
 */
export const MONTO_MAXIMO_PAGO = 1_000_000_000;

/**
 * Lo que escribe la persona.
 *
 * El monto va como string (es lo que da un TextInput) y se convierte al armar
 * el body. El tope "no puede dejar mas de lo que debe" NO va aca: la deuda
 * llega con una request, y un schema que la lleve adentro quedaria armado con
 * deuda 0 al montar el formulario. Lo chequea `useRegistrarPago`.
 */
export const pagoFormSchema = z.object({
  monto: z
    .string()
    .min(1, 'Poné cuánto deja.')
    .regex(/^\d+$/, 'Solo números, sin puntos.')
    .refine((valor) => Number(valor) > 0, 'Poné cuánto deja.')
    .refine((valor) => Number(valor) <= MONTO_MAXIMO_PAGO, 'El monto va hasta $1.000.000.000.'),
  metodoPago: metodoPagoSchema,
  nota: z.string().trim().max(300, 'La nota puede tener hasta 300 caracteres.'),
});
