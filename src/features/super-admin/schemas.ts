import { z } from 'zod';

import { tipoAvisoSchema } from '@/features/notificaciones/schemas';

/**
 * Schemas del panel del super_admin (`/admin/*` de la API).
 *
 * El contrato completo esta en `docs/SUPER_ADMIN.md`. Son la fuente de verdad:
 * los tipos se INFIEREN de aca y cada respuesta pasa por su schema.
 *
 * Criterio K8, igual que el resto de la app: un valor nuevo del backend (un
 * rol, un proveedor, una plataforma) no rompe la pantalla entera. Los enums
 * llevan `.catch` y los textos que solo se muestran van como `string`.
 */

/**
 * Mongo llama `_id` a la clave primaria. Se renombra aca, que es la unica capa
 * que deberia saber que del otro lado hay un Mongo.
 */
const aId = <T extends { _id: string }>({ _id, ...resto }: T) => ({ id: _id, ...resto });

/** Envoltorio paginado: la misma forma que el resto de la API. */
const paginado = <T extends z.ZodType>(item: T) =>
  z.object({
    datos: z.array(item),
    total: z.number(),
    pagina: z.number(),
    porPagina: z.number(),
    paginas: z.number(),
  });

// ─────────────────────────── Comunes ───────────────────────────

export const rolAdminSchema = z
  .enum(['super_admin', 'administrador', 'desconocido'])
  .catch('desconocido');
export const proveedorAdminSchema = z.enum(['local', 'google', 'desconocido']).catch('desconocido');
export const plataformaSchema = z
  .enum(['android', 'ios', 'web', 'desconocida'])
  .catch('desconocida');

/**
 * En que paso del onboarding quedo una cuenta. `null` = lista para operar.
 * Un paso nuevo del backend se muestra como 'desconocido' en vez de romper.
 */
export const pendienteAdminSchema = z
  .enum(['terminos', 'perfil', 'marca', 'desconocido'])
  .nullable()
  .catch('desconocido');

export const estadisticasMarcaSchema = z.object({
  cantidadClientes: z.number().default(0),
  totalVendido: z.number().default(0),
  totalCobrado: z.number().default(0),
  deudaPendiente: z.number().default(0),
  actualizadasEl: z.string().nullish(),
});

// ─────────────────────────── Tablero ───────────────────────────

const usuarioRecienteSchema = z
  .object({
    _id: z.string(),
    nombre: z.string(),
    email: z.string(),
    avatar: z.string().nullish(),
    proveedor: proveedorAdminSchema.optional(),
    createdAt: z.string(),
    marca: z.object({ _id: z.string(), nombre: z.string() }).transform(aId).nullish(),
  })
  .transform(aId);

const marcaRecienteSchema = z
  .object({
    _id: z.string(),
    nombre: z.string(),
    logoUrl: z.string().nullish(),
    createdAt: z.string(),
    estadisticas: estadisticasMarcaSchema,
  })
  .transform(aId);

/** GET /admin/resumen: todo el tablero en una sola respuesta. */
export const resumenPlataformaSchema = z.object({
  generadoEl: z.string(),
  usuarios: z.object({
    administradores: z.number(),
    superAdmins: z.number(),
    porProveedor: z.record(z.string(), z.number()),
    nuevos: z.object({ hoy: z.number(), ultimos7d: z.number(), ultimos30d: z.number() }),
    activos: z.object({ ultimos7d: z.number(), ultimos30d: z.number() }),
    suspendidos: z.number(),
    pendientes: z.object({ terminos: z.number(), perfil: z.number(), marca: z.number() }),
  }),
  marcas: z.object({
    total: z.number(),
    nuevas30d: z.number(),
    activas30d: z.number(),
    inactivas30d: z.number(),
    conLogo: z.number(),
  }),
  negocio: z.object({
    clientes: z.number(),
    facturasConDeuda: z.number(),
    facturasVencidas: z.number(),
    historico: z.object({ vendido: z.number(), cobrado: z.number(), deudaPendiente: z.number() }),
    ultimos30d: z.object({
      tickets: z.number(),
      pagos: z.number(),
      vendido: z.number(),
      cobrado: z.number(),
    }),
  }),
  errores: z.object({
    ultimas24h: z.number(),
    ultimos7d: z.number(),
    fatales7d: z.number(),
    distintos7d: z.number(),
  }),
  recientes: z.object({
    usuarios: z.array(usuarioRecienteSchema),
    marcas: z.array(marcaRecienteSchema),
  }),
});

export const agruparCrecimientoSchema = z.enum(['dia', 'mes']);

const valoresTramoSchema = z.object({
  usuarios: z.number(),
  marcas: z.number(),
  tickets: z.number(),
  pagos: z.number(),
  vendido: z.number(),
  cobrado: z.number(),
});

export const tramoCrecimientoSchema = valoresTramoSchema.extend({
  /** `"2026-09-23"` o `"2026-09"`, ya en hora de Argentina. */
  periodo: z.string(),
});

/** GET /admin/crecimiento. Los tramos sin movimiento vienen en 0: no hay huecos. */
export const crecimientoSchema = z.object({
  agrupar: agruparCrecimientoSchema.catch('dia'),
  desde: z.string(),
  hasta: z.string(),
  serie: z.array(tramoCrecimientoSchema),
  totales: valoresTramoSchema,
});

// ─────────────────────────── Usuarios ───────────────────────────

/** Lo que trae SIEMPRE una cuenta, en el listado y en el detalle. */
const camposUsuario = {
  _id: z.string(),
  nombre: z.string(),
  email: z.string(),
  rol: rolAdminSchema,
  proveedor: proveedorAdminSchema.default('local'),
  dni: z.string().nullish(),
  avatar: z.string().nullish(),
  aceptoTerminosYCondiciones: z.boolean().default(false),
  terminosYCondicionesVersion: z.string().nullish(),
  terminosYCondicionesAceptadosEn: z.string().nullish(),
  /** No viene si nunca entro desde que se registra el acceso. */
  ultimoAcceso: z.string().nullish(),
  ultimaVersionApp: z.string().nullish(),
  suspendida: z.boolean().default(false),
  suspendidaEl: z.string().nullish(),
  motivoSuspension: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
};

const marcaDelUsuarioSchema = z
  .object({ _id: z.string(), nombre: z.string(), logoUrl: z.string().nullish() })
  .transform(aId);

/** Un renglon de GET /admin/usuarios (y la respuesta del alta, 201). */
export const usuarioEnListadoSchema = z
  .object({
    ...camposUsuario,
    marca: marcaDelUsuarioSchema.nullish(),
    pendiente: pendienteAdminSchema.default(null),
  })
  .transform(aId);

export const paginaUsuariosSchema = paginado(usuarioEnListadoSchema);

/** Un dueno de una marca, como lo devuelven el detalle de usuario y el de marca. */
export const duenoAdminSchema = z
  .object({
    _id: z.string(),
    nombre: z.string(),
    email: z.string(),
    dni: z.string().nullish(),
    avatar: z.string().nullish(),
    ultimoAcceso: z.string().nullish(),
    suspendida: z.boolean().optional(),
  })
  .transform(aId);

/** Quien creo la marca: el id en el listado, el objeto en el detalle, null si ya no existe. */
const creadaPorSchema = z
  .union([
    z.string(),
    z.object({ _id: z.string(), nombre: z.string(), email: z.string() }).transform(aId),
  ])
  .nullish();

/** Lo comun a una marca con sus duenos. Suelto para poder extenderlo. */
const camposMarca = {
  _id: z.string(),
  nombre: z.string(),
  direccion: z.string().nullish(),
  telefono: z.string().nullish(),
  logoUrl: z.string().nullish(),
  colorPrimario: z.string().nullish(),
  colorSecundario: z.string().nullish(),
  creadaPor: creadaPorSchema,
  estadisticas: estadisticasMarcaSchema,
  duenos: z.array(duenoAdminSchema).default([]),
  puedeSubirLogo: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
};

export const marcaConDuenosSchema = z.object(camposMarca).transform(aId);

/** GET /admin/usuarios/:id, y lo que devuelven editar, suspender y reactivar. */
export const detalleUsuarioSchema = z.object({
  usuario: z.object({ ...camposUsuario, marca: z.string().nullish() }).transform(aId),
  pendiente: pendienteAdminSchema.default(null),
  marca: marcaConDuenosSchema.nullable(),
  actividad: z.object({
    ultimoAcceso: z.string().nullable(),
    ultimaVersionApp: z.string().nullable(),
    ticketsRegistrados: z.number(),
    pagosRegistrados: z.number(),
    ultimoTicketEl: z.string().nullable(),
    ultimoPagoEl: z.string().nullable(),
    erroresApp30d: z.number(),
  }),
});

/** La palabra que hay que escribir para borrar una cuenta. La exige el backend. */
export const PALABRA_ELIMINAR = 'ELIMINAR';

export const mensajeSchema = z.object({ mensaje: z.string() });

export const usuarioEliminadoSchema = z.object({
  mensaje: z.string(),
  usuarioEliminado: z.boolean(),
  marcaEliminada: z.boolean().default(false),
  datosDelNegocioEliminados: z.boolean().default(false),
});

/**
 * El `detalles` del 409 UNICO_DUENO: la marca que se perderia, para mostrar
 * en el segundo dialogo que se lleva puesto.
 */
export const detallesUnicoDuenoSchema = z.object({
  marca: z
    .object({ _id: z.string(), nombre: z.string(), estadisticas: estadisticasMarcaSchema })
    .transform(aId),
});

// ─── Formularios de usuarios ───

/** 7 u 8 numeros, con o sin puntos: el backend los saca. */
const dniOpcional = z
  .string()
  .trim()
  .refine((dni) => dni === '' || /^\d{7,8}$/.test(dni.replace(/\./g, '')), {
    message: 'El DNI tiene 7 u 8 números.',
  });

export const crearUsuarioFormSchema = z.object({
  nombre: z.string().trim().min(1, 'Poné el nombre.').max(100, 'Hasta 100 caracteres.'),
  email: z.email('Ese email no parece válido.'),
  password: z.string().min(6, 'La contraseña necesita al menos 6 caracteres.'),
  rol: z.enum(['administrador', 'super_admin']),
  dni: dniOpcional,
});

export const editarUsuarioFormSchema = z.object({
  nombre: z.string().trim().min(1, 'Poné el nombre.').max(100, 'Hasta 100 caracteres.'),
  email: z.email('Ese email no parece válido.'),
  dni: dniOpcional,
});

// ─────────────────────────── Marcas ───────────────────────────

/** Un renglon de GET /admin/marcas. */
export const marcaEnListadoSchema = z
  .object({ ...camposMarca, ultimaActividad: z.string().nullish() })
  .transform(aId);

export const paginaMarcasSchema = paginado(marcaEnListadoSchema);

/** GET /admin/marcas/:id, y lo que devuelven editar, sumar y sacar dueno. */
export const detalleMarcaSchema = z.object({
  marca: marcaConDuenosSchema,
  uso: z.object({
    clientes: z.number(),
    especies: z.number(),
    facturas: z.object({
      abierta: z.number(),
      pagada: z.number(),
      anulada: z.number(),
      vencidas: z.number(),
    }),
    tickets: z.object({ total: z.number(), anulados: z.number(), ultimos30d: z.number() }),
    pagos: z.object({ total: z.number(), anulados: z.number(), ultimos30d: z.number() }),
    ultimaActividad: z.string().nullable(),
    activa: z.boolean(),
  }),
});

export const recalculoTodasSchema = z.object({
  recalculadas: z.number(),
  fallidas: z.array(z.string()).default([]),
  milisegundos: z.number(),
});

/** `#4A1866`: lo mismo que acepta la marca del dueno. Vacio = sin color. */
const colorHex = z
  .string()
  .trim()
  .refine((color) => color === '' || /^#[0-9a-fA-F]{6}$/.test(color), {
    message: 'Un color como #4A1866.',
  });

export const editarMarcaFormSchema = z.object({
  nombre: z.string().trim().min(1, 'Poné el nombre.').max(80, 'Hasta 80 caracteres.'),
  direccion: z.string().trim(),
  telefono: z.string().trim(),
  colorPrimario: colorHex,
  colorSecundario: colorHex,
});

export const sumarDuenoFormSchema = z.object({
  dni: z
    .string()
    .trim()
    .refine((dni) => /^\d{7,8}$/.test(dni.replace(/\./g, '')), {
      message: 'El DNI tiene 7 u 8 números.',
    }),
});

// ─────────────────────────── Errores de la app ───────────────────────────

/** Un grupo de errores: el mismo error en 100 telefonos es un renglon. */
export const grupoErrorSchema = z.object({
  huella: z.string(),
  nombre: z.string().nullable(),
  mensaje: z.string(),
  ruta: z.string().nullable(),
  cantidad: z.number(),
  fatales: z.number(),
  usuariosAfectados: z.number(),
  marcasAfectadas: z.number(),
  versiones: z.array(z.string()).default([]),
  plataformas: z.array(plataformaSchema).default([]),
  primeraVez: z.string(),
  ultimaVez: z.string(),
});

export const listadoErroresSchema = paginado(grupoErrorSchema).extend({
  dias: z.number(),
  ocurrencias: z.number(),
});

export const ocurrenciaErrorSchema = z
  .object({
    _id: z.string(),
    mensaje: z.string(),
    nombre: z.string().nullish(),
    stack: z.string().nullish(),
    componentStack: z.string().nullish(),
    ruta: z.string().nullish(),
    fatal: z.boolean(),
    version: z.string().nullish(),
    plataforma: plataformaSchema,
    versionSO: z.string().nullish(),
    dispositivo: z.string().nullish(),
    ocurridoEn: z.string().nullish(),
    createdAt: z.string(),
    usuario: z
      .object({ _id: z.string(), nombre: z.string(), email: z.string() })
      .transform(aId)
      .nullable(),
    marca: z.object({ _id: z.string(), nombre: z.string() }).transform(aId).nullable(),
  })
  .transform(aId);

export const detalleErrorSchema = z.object({
  dias: z.number(),
  grupo: grupoErrorSchema,
  ocurrencias: paginado(ocurrenciaErrorSchema),
});

export const errorResueltoSchema = z.object({
  mensaje: z.string(),
  borrados: z.number(),
});

// ─────────────────────────── Sistema ───────────────────────────

export const estadoSistemaSchema = z.object({
  generadoEl: z.string(),
  servidor: z.object({
    entorno: z.string(),
    node: z.string(),
    uptimeSegundos: z.number(),
    iniciadoEl: z.string(),
    memoria: z.object({ rssMb: z.number(), heapUsadoMb: z.number(), heapTotalMb: z.number() }),
  }),
  mongo: z.object({
    /** Texto y no enum: solo se muestra, y un estado nuevo no rompe la pantalla. */
    estado: z.string(),
    base: z.string(),
    tamano: z
      .object({ datosMb: z.number(), almacenamientoMb: z.number(), indicesMb: z.number() })
      .nullable(),
    colecciones: z
      .array(
        z.object({ nombre: z.string(), documentos: z.number(), tamanoMb: z.number().nullable() }),
      )
      .default([]),
  }),
  servicios: z.record(z.string(), z.boolean()),
  app: z.object({
    minima: z.string().nullish(),
    ultima: z.string().nullish(),
    urlTienda: z.string().nullish(),
    versionDocumentosLegales: z.string().nullish(),
    versionesEnUso: z
      .array(z.object({ version: z.string(), usuarios: z.number(), bloqueada: z.boolean() }))
      .default([]),
  }),
});

// ─────────────────────────── Avisos (notificaciones push) ───────────────────────────
//
// docs/NOTIFICACIONES.md, 7. El tipo es el mismo que ve la app.

/** Hasta donde acepta el backend. */
export const LARGO_TITULO_AVISO = 60;
export const LARGO_MENSAJE_AVISO = 500;

export const estadoAvisoSchema = z
  .enum(['enviando', 'enviado', 'fallido', 'desconocido'])
  .catch('desconocido');

export const envioAvisoSchema = z.object({
  dispositivos: z.number(),
  enviados: z.number(),
  rechazados: z.number(),
  entregados: z.number().default(0),
  fallidos: z.number().default(0),
  errores: z.record(z.string(), z.number()).default({}),
  ultimoError: z.string().nullish(),
});

export const avisoAdminSchema = z
  .object({
    _id: z.string(),
    titulo: z.string(),
    mensaje: z.string(),
    tipo: tipoAvisoSchema,
    /** Con el autor en el historial y el detalle; solo el id al crear; null si ya no existe. */
    creadoPor: z
      .union([
        z.object({ _id: z.string(), nombre: z.string(), email: z.string() }).transform(aId),
        z.string(),
      ])
      .nullish(),
    estado: estadoAvisoSchema,
    enviadoEl: z.string().nullish(),
    envio: envioAvisoSchema,
    createdAt: z.string(),
    updatedAt: z.string().optional(),
  })
  .transform(aId);

export const paginaAvisosSchema = paginado(avisoAdminSchema);

export const detalleAvisoSchema = z.object({
  aviso: avisoAdminSchema,
  /** Aceptados por Expo que todavia esperan la confirmacion de Google/Apple. */
  sinConfirmar: z.number().default(0),
});

export const alcanceAvisosSchema = z.object({
  dispositivos: z.number(),
  porPlataforma: z.record(z.string(), z.number()).default({}),
  conSesion: z.number(),
  sinSesion: z.number(),
  cuentas: z.number(),
  activos30d: z.number(),
});

export const resultadoPruebaSchema = z.object({
  dispositivos: z.number(),
  enviados: z.number(),
  rechazados: z.number(),
  errores: z.record(z.string(), z.number()).default({}),
});

export const nuevoAvisoFormSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, 'Poné un título.')
    .max(LARGO_TITULO_AVISO, `Hasta ${LARGO_TITULO_AVISO} caracteres.`),
  mensaje: z
    .string()
    .trim()
    .min(1, 'Escribí el mensaje.')
    .max(LARGO_MENSAJE_AVISO, `Hasta ${LARGO_MENSAJE_AVISO} caracteres.`),
  tipo: z.enum(['novedad', 'mantenimiento', 'version', 'aviso']),
});
