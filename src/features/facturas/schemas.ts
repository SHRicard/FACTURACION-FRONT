import { z } from 'zod';

/** Mongo llama `_id` a la clave primaria. Se renombra en esta capa y nada mas. */
const aId = <T extends { _id: string }>({ _id, ...resto }: T) => ({ id: _id, ...resto });

/** Estados que GUARDA el backend. "vencida" y "sin deuda" no son de estos. */
export const estadoFacturaSchema = z.enum(['abierta', 'cerrada', 'pagada', 'anulada']);

/**
 * El cliente como viene DENTRO de cada fila del listado, ya resuelto.
 *
 * Se manda resuelto a proposito: la lista se arma sin una segunda consulta, y
 * el telefono esta ahi para el boton de WhatsApp cuando llegue la cobranza.
 */
export const clienteEnFacturaSchema = z
  .object({
    _id: z.string(),
    nombre: z.string(),
    dni: z.string(),
    telefono: z.string().optional(),
    limiteCredito: z.number().optional(),
  })
  .transform(aId);

/** Los campos de una factura. Sueltos para poder extenderlos en el detalle. */
const camposFactura = {
  _id: z.string(),
  /**
   * El correlativo del negocio. Se asigna al CERRAR, no al abrir: una factura
   * abierta no tiene numero todavia, y la clave directamente no viene en el
   * JSON (no llega como null).
   */
  numero: z.number().optional(),
  estado: estadoFacturaSchema,
  /**
   * Lo que se MUESTRA. Suma "vencida" y "sin deuda", que se calculan por fecha
   * y por saldo. Va como string y no como enum a proposito: si el backend
   * agrega un estado visible nuevo, preferimos mostrarlo tal cual antes que
   * romper la pantalla entera con un error de Zod.
   */
  estadoVisible: z.string(),
  vencida: z.boolean().default(false),
  desde: z.string().optional(),
  venceEl: z.string(),
  /** Negativo = dias de atraso. */
  diasParaVencer: z.number(),
  cantidadTickets: z.number(),
  totalMercaderia: z.number(),
  totalPagadoEnTickets: z.number(),
  totalFiado: z.number(),
  totalPagos: z.number(),
  /** `totalFiado - totalPagos`. Es EL numero de la pantalla. */
  saldo: z.number(),
};

/** Una fila del listado: la factura con su cliente adentro. */
export const facturaEnListaSchema = z
  .object({ ...camposFactura, cliente: clienteEnFacturaSchema })
  .transform(aId);

export const paginaFacturasSchema = z.object({
  datos: z.array(facturaEnListaSchema),
  total: z.number(),
  pagina: z.number(),
  porPagina: z.number(),
  paginas: z.number(),
});

/** Las vencidas vienen como array plano, ya ordenadas por atraso. */
export const listaVencidasSchema = z.array(facturaEnListaSchema);

/**
 * Un renglon de un ticket, como viene dentro del detalle de la factura.
 *
 * `especie` va opcional porque el detalle manda `especieNombre` ya copiado y no
 * siempre incluye el id: la tabla se arma con el nombre y listo.
 */
export const itemEnFacturaSchema = z.object({
  nombre: z.string(),
  talle: z.string().optional(),
  especie: z.string().optional(),
  especieNombre: z.string().optional(),
  cantidad: z.number(),
  precioUnitario: z.number(),
  subtotal: z.number(),
});

/**
 * Un ticket dentro de la factura.
 *
 * Los campos que en el detalle del ticket son obligatorios van opcionales aca:
 * esta respuesta los omite porque ya se sabe de que factura y de que cliente
 * son. Pedirlos romperia la pantalla por un dato que no se usa.
 */
export const ticketEnFacturaSchema = z
  .object({
    _id: z.string(),
    fecha: z.string(),
    items: z.array(itemEnFacturaSchema),
    total: z.number(),
    pagado: z.number(),
    faltante: z.number(),
    anulado: z.boolean().default(false),
    anuladoEl: z.string().nullish(),
    motivoAnulacion: z.string().nullish(),
  })
  .transform(aId);

/** Un pago a cuenta, aparte de lo que deja en cada ticket. */
export const pagoSchema = z
  .object({
    _id: z.string(),
    fecha: z.string(),
    monto: z.number(),
    metodoPago: z.string().optional(),
    nota: z.string().optional(),
  })
  .transform(aId);

/**
 * El detalle de una factura: la cuenta entera de un periodo.
 *
 * `GET /clientes/:id/factura-actual` devuelve exactamente esta misma forma, a
 * proposito: la pantalla de la factura es una sola, se llegue desde el listado
 * de facturacion o desde la ficha del cliente.
 */
export const facturaDetalleSchema = z.object({
  cliente: z
    .object({
      _id: z.string(),
      nombre: z.string(),
      dni: z.string(),
      telefono: z.string().optional(),
      email: z.string().optional(),
      direccion: z.string().optional(),
      limiteCredito: z.number().optional(),
      ventanaPago: z.object({ desdeDia: z.number(), hastaDia: z.number() }).optional(),
    })
    .transform(aId),
  factura: z.object(camposFactura).transform(aId),
  /** Ordenados por fecha ascendente: se leen como la libreta. */
  tickets: z.array(ticketEnFacturaSchema).default([]),
  pagos: z.array(pagoSchema).default([]),
});
