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

/** Estados reales que guarda el backend. "vencida" NO es uno de ellos. */
export const estadoFacturaSchema = z.enum(['abierta', 'cerrada', 'pagada', 'anulada']);

export const facturaAbiertaSchema = z
  .object({
    _id: z.string(),
    estado: estadoFacturaSchema,
    /**
     * Lo que se MUESTRA. Suma "vencida" y "sin deuda", que se calculan por
     * fecha y por saldo y no existen como `estado`. Va como string y no como
     * enum a proposito: si el backend agrega un estado visible nuevo, preferimos
     * mostrarlo tal cual antes que romper la pantalla entera con un error de Zod.
     */
    estadoVisible: z.string(),
    venceEl: z.string(),
    saldo: z.number(),
    cantidadTickets: z.number(),
    vencida: z.boolean(),
    diasParaVencer: z.number(),
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
