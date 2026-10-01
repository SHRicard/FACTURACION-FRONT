import { z } from 'zod';

import { pagoSchema } from '@/features/pagos/schemas';

/** Mongo llama `_id` a la clave primaria. Se renombra en esta capa y nada mas. */
const aId = <T extends { _id: string }>({ _id, ...resto }: T) => ({ id: _id, ...resto });

/**
 * Estados que GUARDA el backend. "vencida" y "sin deuda" no son de estos.
 *
 * No existe `cerrada`: el cliente tiene UNA factura activa (`abierta`), que
 * sigue recibiendo tickets aunque venza, y se cierra (`pagada`) recien cuando
 * un pago la deja en cero.
 */
export const estadoFacturaSchema = z.enum(['abierta', 'pagada', 'anulada']);

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
   * El correlativo del negocio. Se asigna al SALDARLA: la factura activa no
   * tiene numero, y puede llegar como null o directamente sin la clave.
   */
  numero: z.number().nullish(),
  /**
   * El estado que guarda el backend. Los conocidos siguen en
   * `estadoFacturaSchema`, que tipa el filtro que manda el front
   * (`FiltrosFacturas.estado`); la respuesta se lee como string para que un
   * estado nuevo del backend no rompa la lista (K8). Las pantallas ya comparan
   * con literales.
   */
  estado: z.string(),
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
  /** Negativo = días de atraso; null = sin compras (fecha provisoria, K3). */
  diasParaVencer: z.number().nullable(),
  cantidadTickets: z.number(),
  totalMercaderia: z.number(),
  totalPagadoEnTickets: z.number(),
  totalFiado: z.number(),
  totalPagos: z.number(),
  /** `totalFiado - totalPagos`. Es EL numero de la pantalla. */
  saldo: z.number(),
  /** Cuantos pagos recibio. NO cuenta los anulados. */
  cantidadPagos: z.number().optional(),
  /** Fecha del ultimo pago no anulado; null si no tiene ninguno. */
  ultimoPagoEl: z.string().nullish(),
  /** `totalPagos / totalFiado`, de 0 a 100. Para la barra de progreso. */
  porcentajeCobrado: z.number().optional(),
  /** Cuando la termino de pagar: el "saldada el". */
  pagadaEl: z.string().nullish(),
  /**
   * La fecha que se fijo con el primer ticket. No cambia al reprogramar: el
   * cumplimiento se mide contra esta. Falta en facturas de antes del cambio.
   */
  vencimientoOriginal: z.string().nullish(),
  /** `venceEl` se cambio despues del primer ticket ("te pago el 30"). */
  reprogramada: z.boolean().default(false),
  /**
   * Que tan bien pago, de 0 a 100; `null` si no hubo nada fiado. En la activa
   * cambia con cada pago, en la pagada queda fijo. Ver `chipCumplimiento`.
   */
  cumplimiento: z.number().nullish(),
};

/** La factura sola, como la devuelven reprogramar y cerrar. */
export const facturaSchema = z.object(camposFactura).transform(aId);

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
  factura: facturaSchema,
  /** Ordenados por fecha ascendente: se leen como la libreta. */
  tickets: z.array(ticketEnFacturaSchema).default([]),
  /**
   * Los pagos de ESTA factura, ordenados por fecha, anulados incluidos. El
   * schema es el de la feature de pagos: la forma del pago es una sola.
   */
  pagos: z.array(pagoSchema).default([]),
});

// ─────────────────── Mandar la factura ───────────────────

/** POST /facturas/:id/enlace: el link publico y el mensaje de WhatsApp ya escrito. */
export const enlaceFacturaSchema = z.object({
  url: z.string(),
  venceEl: z.string(),
  diasValidez: z.number(),
  textoWhatsApp: z.string(),
  /** Abre WhatsApp con el chat del cliente y el mensaje escrito: solo falta tocar enviar. */
  urlWhatsApp: z.string(),
  /** null = el cliente no tiene un celular que se entienda: el contacto se elige a mano. */
  telefonoWhatsApp: z.string().nullable(),
});

/** POST /facturas/:id/enviar. */
export const envioFacturaSchema = z.object({
  enviado: z.literal(true),
  para: z.string(),
  asunto: z.string(),
  archivo: z.string(),
});

/** DELETE /facturas/:id/enlace: los links ya mandados dejan de abrir. */
export const bajaEnlacesSchema = z.object({ mensaje: z.string() });

/** El tope del backend para el mensaje del mail. */
export const LARGO_MAXIMO_MENSAJE_MAIL = 500;

/**
 * El mail de la factura. El email vacio va al del cliente; el que se escriba
 * aca NO se guarda en el cliente (para eso esta editarlo).
 */
export const mailFacturaFormSchema = z.object({
  email: z.union([z.literal(''), z.email('El email no tiene un formato válido.')]),
  mensaje: z
    .string()
    .trim()
    .max(LARGO_MAXIMO_MENSAJE_MAIL, `Hasta ${LARGO_MAXIMO_MENSAJE_MAIL} caracteres.`),
});
