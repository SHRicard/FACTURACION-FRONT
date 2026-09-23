import { z } from 'zod';

/**
 * Ventana de pago: los dias del mes en que este cliente paga.
 *
 * Es lo que distingue a un cliente de una ficha de contacto: de aca sale el
 * vencimiento de cada factura suya. Rosa paga del 1 al 10, Pedro del 20 al 30.
 */
export const ventanaPagoSchema = z.object({
  desdeDia: z.number().int().min(1).max(31),
  hastaDia: z.number().int().min(1).max(31),
});

/**
 * Los campos que trae SIEMPRE un cliente. Se declaran sueltos (y no como schema)
 * para poder extenderlos: una vez que un schema tiene `.transform()`, ya no se
 * le pueden agregar campos.
 */
const camposCliente = {
  _id: z.string(),
  nombre: z.string(),
  dni: z.string(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  direccion: z.string().optional(),
  /** 0 = sin limite. */
  limiteCredito: z.number(),
  ventanaPago: ventanaPagoSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
};

/**
 * Mongo llama `_id` a la clave primaria. Se renombra aca, que es la unica capa
 * que deberia saber que del otro lado hay un Mongo.
 */
const aId = <T extends { _id: string }>({ _id, ...resto }: T) => ({ id: _id, ...resto });

export const clienteSchema = z.object(camposCliente).transform(aId);

/**
 * Como viene en el listado: con los totales ya calculados.
 *
 * `deuda` es la suma de TODAS sus facturas con saldo, no solo la del mes, y
 * `facturasVencidas` cuantas se le pasaron de fecha. Los calcula la consulta,
 * no estan guardados, asi que no hay que intentar mantenerlos en cache a mano.
 */
export const clienteEnListaSchema = z
  .object({
    ...camposCliente,
    deuda: z.number(),
    facturasVencidas: z.number(),
  })
  .transform(aId);

/**
 * Estados reales que guarda el backend. "vencida" NO es uno de ellos, y
 * `cerrada` ya no existe: la factura activa sigue abierta hasta que se salda.
 */
export const estadoFacturaSchema = z.enum(['abierta', 'pagada', 'anulada']);

export const facturaAbiertaSchema = z
  .object({
    _id: z.string(),
    /**
     * El estado que guarda el backend. Los conocidos siguen en
     * `estadoFacturaSchema`; la respuesta se lee como string para que un estado
     * nuevo del backend no rompa la ficha (K8). Las pantallas ya comparan con
     * literales.
     */
    estado: z.string(),
    /**
     * Lo que se MUESTRA. Suma "vencida" y "sin deuda", que se calculan por
     * fecha y por saldo y no existen como `estado`. Va como string y no como
     * enum a proposito: si el backend agrega un estado visible nuevo, preferimos
     * mostrarlo tal cual antes que romper la pantalla entera con un error de Zod.
     */
    estadoVisible: z.string(),
    venceEl: z.string(),
    saldo: z.number(),
    /**
     * Lo fiado y lo pagado a cuenta. El back ya los manda (serializarFactura);
     * con ellos el ticket avisa antes de dejar la factura en negativo (K2).
     */
    totalFiado: z.number().default(0),
    totalPagos: z.number().default(0),
    cantidadTickets: z.number(),
    vencida: z.boolean(),
    /** null = sin compras: su fecha es provisoria (K3). */
    diasParaVencer: z.number().nullable(),
    /**
     * El próximo ticket vuelve a fijar el vencimiento: la factura no tiene
     * tickets o quedó en $0 (K15). Falta con un back viejo.
     */
    eligeVencimiento: z.boolean().optional(),
    /** La fecha del primer ticket; no cambia al reprogramar. */
    vencimientoOriginal: z.string().nullish(),
    /** `venceEl` se cambio despues del primer ticket. */
    reprogramada: z.boolean().default(false),
  })
  .transform(aId);

/**
 * El detalle, y tambien lo que devuelve el alta (201): el cliente mas la
 * factura que el backend le abre solo.
 *
 * `deuda` va con default porque la respuesta del alta no la trae: un cliente
 * recien creado no debe nada.
 */
export const clienteDetalleSchema = z
  .object({
    ...camposCliente,
    deuda: z.number().default(0),
    facturaAbierta: facturaAbiertaSchema.nullable().optional(),
  })
  .transform(aId);

/** Envoltorio paginado del listado. */
export const paginaClientesSchema = z.object({
  datos: z.array(clienteEnListaSchema),
  total: z.number(),
  pagina: z.number(),
  porPagina: z.number(),
  paginas: z.number(),
});

/** Los dias validos de una ventana de pago. El backend rechaza fuera de 1-31. */
const diaDelMes = z.number().int().min(1, 'Entre 1 y 31.').max(31, 'Entre 1 y 31.');

/**
 * Lo que escribe la persona en el formulario de alta y edicion.
 *
 * Los campos de texto se guardan como string (es lo que da un TextInput) y se
 * convierten al armar el body: mantenerlos como number obligaria a manejar el
 * NaN del campo vacio en cada tecla.
 */
export const clienteFormSchema = z
  .object({
    nombre: z.string().trim().min(1, 'Poné el nombre.'),
    dni: z.string().trim().min(1, 'Poné el DNI.').regex(/^\d+$/, 'El DNI va sin puntos ni letras.'),
    telefono: z.string().trim(),
    // El vacio es valido: el email es opcional. Sin este union, un campo en
    // blanco fallaria como "email invalido".
    email: z.union([z.literal(''), z.email('Ese email no parece valido.')]),
    direccion: z.string().trim(),
    limiteCredito: z.string().regex(/^\d*$/, 'Solo numeros, sin puntos.'),
    desdeDia: diaDelMes,
    hastaDia: diaDelMes,
  })
  .refine((datos) => datos.desdeDia <= datos.hastaDia, {
    message: 'El dia de inicio no puede ser posterior al de fin.',
    path: ['hastaDia'],
  });

// ─────────────────── Historial ───────────────────
//
// `GET /clientes/:id/historial`: todavia NO existe en el backend. Es el
// contrato que le pedimos en `docs/HISTORIAL_CLIENTE.md`.

/** Que muestra la lista de movimientos. Filtra SOLO la lista. */
export const tipoMovimientoSchema = z.enum(['todos', 'compras', 'pagos']);

/** La factura a la que se pego un movimiento. Sin numero = la factura en curso. */
const facturaDelMovimientoSchema = z
  .object({ _id: z.string(), numero: z.number().nullish() })
  .transform(aId);

/** Quien cargo el ticket o cobro el pago. `null` si no se sabe. */
const registradoPorSchema = z
  .object({ _id: z.string(), nombre: z.string() })
  .transform(aId)
  .nullish();

/** Lo comun a una compra y a un pago. */
const camposMovimiento = {
  _id: z.string(),
  fecha: z.string(),
  factura: facturaDelMovimientoSchema.nullish(),
  registradoPor: registradoPorSchema,
  /** Baja logica: se muestra tachado, con el motivo, y no suma a nada. */
  anulado: z.boolean().default(false),
  anuladoEl: z.string().nullish(),
  motivoAnulacion: z.string().nullish(),
  /** Cuanto debia EN TOTAL justo despues de este movimiento. `null` en los anulados. */
  saldoPosterior: z.number().nullish(),
};

/** Una compra: el ticket, con lo que se llevo renglon por renglon. */
export const compraSchema = z
  .object({
    tipo: z.literal('compra'),
    ...camposMovimiento,
    items: z
      .array(
        z.object({
          nombre: z.string(),
          talle: z.string().nullish(),
          especieNombre: z.string().nullish(),
          cantidad: z.number(),
          precioUnitario: z.number(),
          subtotal: z.number(),
        }),
      )
      .default([]),
    total: z.number(),
    /** Lo que dejo en el momento. */
    pagado: z.number(),
    /** Lo que quedo anotado: `total - pagado`. */
    faltante: z.number(),
  })
  .transform(aId);

/** Un pago a cuenta. */
export const pagoDelHistorialSchema = z
  .object({
    tipo: z.literal('pago'),
    ...camposMovimiento,
    monto: z.number(),
    /** Texto y no enum: un metodo viejo no puede romper el historial entero. */
    metodoPago: z.string().nullish(),
    nota: z.string().nullish(),
  })
  .transform(aId);

export const movimientoSchema = z.union([compraSchema, pagoDelHistorialSchema]);

/**
 * Una factura del cliente, como la serializa el backend (`serializarFactura`).
 * Schema propio y liviano, y no el de `facturas`: asi esta feature no depende
 * de la otra.
 */
export const facturaDelHistorialSchema = z
  .object({
    _id: z.string(),
    /** Se asigna al saldarla: la factura en curso no tiene. */
    numero: z.number().nullish(),
    /** String y no `estadoFacturaSchema`: un estado nuevo no rompe el historial (K8). */
    estado: z.string(),
    estadoVisible: z.string(),
    desde: z.string().nullish(),
    venceEl: z.string(),
    vencimientoOriginal: z.string().nullish(),
    reprogramada: z.boolean().default(false),
    pagadaEl: z.string().nullish(),
    vencida: z.boolean().default(false),
    cantidadTickets: z.number(),
    totalFiado: z.number(),
    totalPagos: z.number(),
    saldo: z.number(),
    cumplimiento: z.number().nullish(),
  })
  .transform(aId);

/** Los numeros de TODA la historia del cliente. Los anulados no cuentan. */
export const resumenHistorialSchema = z.object({
  /** Lo que debe hoy: el saldo de su factura en curso. */
  deuda: z.number(),
  /** Su factura en curso vencio y todavia debe. */
  moroso: z.boolean(),
  /** Dias desde que vencio. `null` si no esta vencida. */
  diasDeAtraso: z.number().nullable(),
  totalComprado: z.number(),
  /** Lo que dejo en el momento de comprar. */
  totalPagadoAlComprar: z.number(),
  /** Lo que quedo anotado de sus compras. */
  totalFiado: z.number(),
  /** Sus pagos a cuenta. */
  totalPagos: z.number(),
  cantidadTickets: z.number(),
  cantidadPagos: z.number(),
  ticketPromedio: z.number().nullable(),
  /** Su primer ticket: el "cliente desde". `null` si nunca compro. */
  primeraCompra: z.string().nullable(),
  ultimaCompra: z.object({ fecha: z.string(), total: z.number() }).nullable(),
  ultimoPago: z.object({ fecha: z.string(), monto: z.number() }).nullable(),
  diasSinPagar: z.number().nullable(),
  /** Cada cuantos dias vuelve a comprar. `null` con menos de dos visitas. */
  diasEntreCompras: z.number().nullable(),
  /** Que tan bien pago sus facturas: el mismo calculo que mejores-clientes. */
  cumplimiento: z.object({
    evaluadas: z.number(),
    cumplimientoPromedio: z.number().nullable(),
    aTiempo: z.number(),
    tarde: z.number(),
    impagas: z.number(),
  }),
});

export const paginaHistorialSchema = z.object({
  cliente: clienteSchema,
  resumen: resumenHistorialSchema,
  /** Todas sus facturas, la mas nueva primero. */
  facturas: z.array(facturaDelHistorialSchema),
  /** Compras y pagos de todas sus facturas, del mas nuevo al mas viejo. */
  movimientos: z.object({
    datos: z.array(movimientoSchema),
    total: z.number(),
    pagina: z.number(),
    porPagina: z.number(),
    paginas: z.number(),
  }),
});
