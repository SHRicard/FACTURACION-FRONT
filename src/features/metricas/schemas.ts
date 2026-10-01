import { z } from 'zod';

/** Mongo llama `_id` a la clave primaria. Se renombra en esta capa y nada mas. */
const aId = <T extends { _id: string }>({ _id, ...resto }: T) => ({ id: _id, ...resto });

/**
 * Un porcentaje con un decimal (`53.1`), o `null` cuando no hay base para
 * calcularlo: un mes sin nada fiado no tiene tasa de cobranza. Se muestra `—`,
 * nunca `0%`.
 */
const porcentajeSchema = z.number().nullable();

/** Lo que se esta mirando, en `aaaa-mm-dd`. Los dos dias entran enteros. */
export const periodoSchema = z.object({ desde: z.string(), hasta: z.string() });

/**
 * Un punto del grafico por mes, o por semana (de lunes a domingo). Lo usan las
 * dos metricas que miran como fue cambiando algo: morosos y deudores.
 */
export const agruparSchema = z.enum(['mes', 'semana']);

/** El envoltorio de las listas largas: el mismo que clientes y facturas. */
const camposPaginado = {
  total: z.number(),
  pagina: z.number(),
  porPagina: z.number(),
  paginas: z.number(),
};

/**
 * El cliente de cada renglon. Con el `id` se navega a su ficha.
 *
 * Va `nullable` en cada renglon porque el backend lo resuelve con un lookup que
 * conserva los vacios: un cliente borrado de la base deja su deuda sin nombre,
 * y eso no tiene por que romper la pantalla entera.
 */
export const clienteMetricaSchema = z
  .object({
    _id: z.string(),
    nombre: z.string(),
    dni: z.string(),
    telefono: z.string().optional(),
  })
  .transform(aId);

const clienteRenglonSchema = clienteMetricaSchema.nullable();

// ─────────────────── Tasa de cobranza ───────────────────

const camposCobranza = {
  /** Suma del total de los tickets. */
  vendido: z.number(),
  /** Lo que pagaron al comprar. NO entra en la tasa: esa plata nunca se fio. */
  dejadoAlComprar: z.number(),
  /** Lo que quedo anotado. */
  fiado: z.number(),
  /** Los pagos a cuenta. */
  cobrado: z.number(),
  /** `cobrado / fiado`. Puede pasar de 100: los pagos cancelan fiado viejo. */
  tasa: porcentajeSchema,
  /** `fiado - cobrado`: cuanto crecio (+) o se achico (-) la libreta. */
  variacionDeuda: z.number(),
};

export const tasaCobranzaSchema = z.object({
  periodo: periodoSchema,
  total: z.object(camposCobranza),
  /** TODOS los meses del periodo, tambien los vacios. */
  porMes: z.array(z.object({ mes: z.string(), ...camposCobranza })),
});

// ─────────────────── 3. Pagos a tiempo ───────────────────

/**
 * Que tan bien pagaron, factura por factura: cada peso pagado hasta el
 * vencimiento vale 100%, y el pagado tarde pierde 2% por dia de atraso. Se mide
 * contra el vencimiento ORIGINAL: reprogramar no borra el atraso.
 */
const camposCumplimiento = {
  evaluadas: z.number(),
  /** El promedio, de 0 a 100. `null` si no hubo ninguna factura para juzgar. */
  cumplimientoPromedio: porcentajeSchema,
  /** Saldadas con 100%. */
  aTiempo: z.number(),
  /** Saldadas con menos de 100%. */
  tarde: z.number(),
  /** Vencidas que todavia deben. */
  impagas: z.number(),
  porcentajeATiempo: porcentajeSchema,
  /** De las que se pagaron tarde, cuanto se pasaron. `null` si ninguna. */
  diasPromedioDeAtraso: z.number().nullable(),
  saldoImpago: z.number(),
};

export const cumplimientoSchema = z.object(camposCumplimiento);

export const pagosATiempoSchema = z.object({
  periodo: periodoSchema,
  resumen: cumplimientoSchema,
  porMes: z.array(z.object({ mes: z.string(), ...camposCumplimiento })),
});

// ─────────────────── 4. Deudores y morosos ───────────────────

/**
 * Un deudor: cliente con saldo, vencido o no. El moroso es el caso con la
 * factura ya vencida, y tiene su propia metrica.
 *
 * Los tres ultimos campos son los que le pedimos al backend en
 * `docs/DEUDORES.md`: van opcionales para que la pantalla siga andando hasta
 * que lleguen. `undefined` = todavia no los manda; `null` = no tiene.
 */
export const deudorSchema = z.object({
  posicion: z.number(),
  cliente: clienteRenglonSchema,
  saldo: z.number(),
  saldoVencido: z.number(),
  facturas: z.number(),
  facturasVencidas: z.number(),
  vencimientoMasViejo: z.string().nullable(),
  /** Desde el vencimiento mas viejo que sigue impago. */
  diasDeAtraso: z.number(),
  moroso: z.boolean(),
  ultimaCompra: z.object({ fecha: z.string(), total: z.number() }).nullish(),
  ultimoPago: z.object({ fecha: z.string(), monto: z.number().optional() }).nullish(),
  diasSinPagar: z.number().nullish(),
});

/**
 * Un punto de la evolucion: la foto al FINAL del tramo. `deudores` = el del
 * punto anterior + `nuevos` - `saldaron`.
 */
export const puntoDeudoresSchema = z.object({
  /** `2026-04` por mes; por semana, el lunes: `2026-08-31`. */
  etiqueta: z.string(),
  desde: z.string(),
  hasta: z.string(),
  deudores: z.number(),
  /** Los que EMPEZARON a deber en el tramo. */
  nuevos: z.number(),
  /** Los que TERMINARON de pagar en el tramo. */
  saldaron: z.number(),
  deudaTotal: z.number(),
  deudaVencida: z.number(),
});

export const paginaDeudoresSchema = z.object({
  /** Con `evolucion`: todavia no lo manda el backend (ver `docs/DEUDORES.md`). */
  periodo: periodoSchema.optional(),
  agrupar: agruparSchema.optional(),
  /** De TODA la marca: no cambia con la busqueda. */
  resumen: z.object({
    deudores: z.number(),
    morosos: z.number(),
    deudaTotal: z.number(),
    deudaVencida: z.number(),
    porcentajeVencida: porcentajeSchema,
    /** Desde aca abajo, lo pedido en `docs/DEUDORES.md`. */
    clientes: z.number().optional(),
    porcentajeDeClientes: porcentajeSchema.optional(),
    deudoresAlInicioDelPeriodo: z.number().optional(),
    /** `+4` = hay 4 deudores mas que al empezar el periodo. */
    variacionDeDeudores: z.number().optional(),
    deudaAlInicioDelPeriodo: z.number().optional(),
    /** Si la libreta crecio (+) o se achico (-) en el periodo. */
    variacionDeDeuda: z.number().optional(),
  }),
  /** Vacia hasta que el backend la mande: sin puntos no se dibuja el grafico. */
  evolucion: z.array(puntoDeudoresSchema).default([]),
  datos: z.array(deudorSchema),
  ...camposPaginado,
});

// ─────────────────── 5. Dejaron de comprar y deben ───────────────────

export const clienteInactivoSchema = z.object({
  cliente: clienteRenglonSchema,
  saldo: z.number(),
  saldoVencido: z.number(),
  /** `null` = no tiene ningun ticket que cuente. */
  ultimaCompra: z.object({ fecha: z.string(), total: z.number() }).nullable(),
  /** `null` = nunca pago nada a cuenta. No es lo mismo que pagar poco. */
  ultimoPago: z.object({ fecha: z.string(), monto: z.number().optional() }).nullable(),
  diasSinComprar: z.number().nullable(),
});

export const paginaInactivosSchema = z.object({
  dias: z.number(),
  resumen: z.object({ clientes: z.number(), deuda: z.number() }),
  datos: z.array(clienteInactivoSchema),
  ...camposPaginado,
});

// ─────────────────── 6. Mejores clientes ───────────────────

export const mejorClienteSchema = z.object({
  posicion: z.number(),
  cliente: clienteRenglonSchema,
  comprado: z.number(),
  tickets: z.number(),
  /** `null`: tiene facturas para juzgar, pero no compro nada en el periodo. */
  ticketPromedio: z.number().nullable(),
  fiado: z.number(),
  porcentajeFiado: porcentajeSchema,
  /**
   * Su promedio de cumplimiento, de todas sus facturas. Con `evaluadas: 0` no
   * hay nada que juzgar: va al final y se muestra "sin historial".
   */
  cumplimiento: cumplimientoSchema,
  /** Lo que debe HOY, de cualquier periodo. */
  saldo: z.number(),
});

export const mejoresClientesSchema = z.object({
  /** `null` = toda la historia: sin `desde`/`hasta`, el backend no recorta. */
  periodo: periodoSchema.nullable(),
  clientes: z.array(mejorClienteSchema),
});

// ─────────────────── 7. Frecuencia de compra ───────────────────

export const estadoFrecuenciaSchema = z.enum(['al-ritmo', 'demorado', 'sin-historial']);

export const frecuenciaClienteSchema = z.object({
  cliente: clienteRenglonSchema,
  /** Dias distintos en que compro: dos tickets el mismo dia son una visita. */
  visitas: z.number(),
  primeraCompra: z.string(),
  ultimaCompra: z.string(),
  /** Cada cuantos dias vuelve. `null` con una sola visita. */
  diasEntreCompras: z.number().nullable(),
  diasDesdeUltima: z.number(),
  proximaCompra: z.string().nullable(),
  // Un estado nuevo del backend se muestra como 'sin-historial', el único que
  // no marca nada, en vez de romper la lista (K8).
  estado: estadoFrecuenciaSchema.catch('sin-historial'),
});

export const paginaFrecuenciaSchema = z.object({
  periodo: periodoSchema,
  resumen: z.object({
    clientes: z.number(),
    conHistorial: z.number(),
    demorados: z.number(),
    /** El promedio de la clientela: "tus clientes vuelven cada 27 dias". */
    diasEntreCompras: z.number().nullable(),
  }),
  datos: z.array(frecuenciaClienteSchema),
  ...camposPaginado,
});

// ─────────────────── 8. Ventas por especie ───────────────────

/**
 * La especie de un renglon del ranking. El nombre es el de HOY: si la
 * renombraron, las ventas viejas salen con el nombre nuevo. Los items viejos
 * cargados sin especie llegan sin id ni nombre y se agrupan como "Sin especie":
 * esos no tienen detalle que abrir.
 */
const especieDelRankingSchema = z
  .object({ _id: z.string().nullable(), nombre: z.string().nullable() })
  .transform(({ _id, nombre }) => ({ id: _id, nombre: nombre ?? 'Sin especie' }));

/** Cuanto se vendio de algo: una especie, un mes, un talle, un articulo. */
const camposVenta = { unidades: z.number(), monto: z.number() };

export const especieVendidaSchema = z.object({
  posicion: z.number(),
  especie: especieDelRankingSchema,
  ...camposVenta,
  /** Que parte de todas las unidades vendidas es de esta especie. */
  porcentajeUnidades: porcentajeSchema,
  /** Que parte de toda la plata. */
  porcentajeMonto: porcentajeSchema,
});

export const ventasPorEspecieSchema = z.object({
  periodo: periodoSchema,
  resumen: z.object({
    ...camposVenta,
    /** Cuantas especies vendieron algo en el periodo. */
    especies: z.number(),
    /** La primera del ranking, segun el orden. `null` si no hubo ventas. */
    masVendida: z
      .object({ _id: z.string().nullable(), nombre: z.string().nullable(), ...camposVenta })
      .transform(({ _id, nombre, ...venta }) => ({
        id: _id,
        nombre: nombre ?? 'Sin especie',
        ...venta,
      }))
      .nullable(),
  }),
  /** Solo las que vendieron algo en el periodo, ya ordenadas. */
  especies: z.array(especieVendidaSchema),
});

/** `GET /metricas/ventas-por-especie/:especie`: una especie sola, con el mismo periodo. */
export const detalleEspecieSchema = z.object({
  periodo: periodoSchema,
  especie: z.object({ _id: z.string(), nombre: z.string() }).transform(aId),
  resumen: z.object({
    ...camposVenta,
    /** En cuantos tickets aparecio. */
    tickets: z.number(),
    /** Que parte de TODO lo vendido en el periodo es de esta especie. */
    porcentajeUnidades: porcentajeSchema,
    porcentajeMonto: porcentajeSchema,
  }),
  /** TODOS los meses del periodo, tambien los que no vendio (en 0). */
  porMes: z.array(z.object({ mes: z.string(), ...camposVenta })),
  /**
   * Del que mas sale al que menos. `null` = los renglones cargados sin talle.
   * El porcentaje es de las unidades DE ESTA especie.
   */
  talles: z.array(
    z.object({ talle: z.string().nullable(), ...camposVenta, porcentaje: porcentajeSchema }),
  ),
  /** Como se escribio en el ticket, sin distinguir mayusculas. Hasta 50. */
  articulos: z.array(
    z.object({ nombre: z.string(), ...camposVenta, porcentaje: porcentajeSchema }),
  ),
});

// ─────────────────── Perfil del cliente ───────────────────
//
// `GET /clientes/:id/perfil`: todavia NO existe en el backend. Es el contrato
// que le pedimos en `docs/PERFIL_CLIENTE.md`.

/** El cliente del perfil: los mismos campos que `GET /clientes/:id`. */
const clienteDelPerfilSchema = z
  .object({
    _id: z.string(),
    nombre: z.string(),
    dni: z.string(),
    telefono: z.string().optional(),
    email: z.string().optional(),
    direccion: z.string().optional(),
    /** 0 = sin limite. De aca sale la sugerencia de subirselo. */
    limiteCredito: z.number(),
    createdAt: z.string().optional(),
  })
  .transform(aId);

/** Un mes de la serie de cumplimiento. Vienen TODOS, tambien los vacios. */
export const mesDeCumplimientoSchema = z.object({
  mes: z.string(),
  /** `null` cuando no hubo ninguna factura para juzgar ese mes. */
  cumplimientoPromedio: porcentajeSchema,
  evaluadas: z.number(),
});

/** Que compra este cliente: lo mismo que el ranking de especies, pero suyo. */
export const especieDelClienteSchema = z.object({
  especie: z
    .object({ _id: z.string().nullable(), nombre: z.string().nullable() })
    .transform(({ _id, nombre }) => ({ id: _id, nombre: nombre ?? 'Sin especie' })),
  unidades: z.number(),
  monto: z.number(),
  /** Sobre lo que compro EL, no sobre el total de la marca. */
  porcentajeUnidades: porcentajeSchema,
  porcentajeMonto: porcentajeSchema,
});

export const perfilClienteSchema = z.object({
  cliente: clienteDelPerfilSchema,
  /** `null` = toda la historia, que es lo que pide el front. */
  periodo: periodoSchema.nullish(),
  cumplimiento: z.object({
    /** De 0 a 100. `null` si no tiene ninguna factura para juzgar. */
    promedio: porcentajeSchema,
    evaluadas: z.number(),
    aTiempo: z.number(),
    tarde: z.number(),
    impagas: z.number(),
    /** Cuantas facturas SEGUIDAS cumplio al 100%, de la mas nueva para atras. */
    rachaEnFecha: z.number(),
    /** De las que pago tarde, cuanto se paso. `null` si nunca pago tarde. */
    diasPromedioDeAtraso: z.number().nullable(),
    porMes: z.array(mesDeCumplimientoSchema).default([]),
  }),
  /** En que puesto queda entre los clientes con facturas para juzgar. */
  ranking: z.object({
    /** `null` si no tiene ninguna factura evaluada. */
    posicion: z.number().nullable(),
    clientes: z.number(),
  }),
  /** Cuanto vale: lo que compro, lo que fio y cuanto pesa en las ventas. */
  valor: z.object({
    comprado: z.number(),
    tickets: z.number(),
    ticketPromedio: z.number().nullable(),
    fiado: z.number(),
    porcentajeFiado: porcentajeSchema,
    /** Lo que debe hoy. */
    saldo: z.number(),
    primeraCompra: z.string().nullable(),
    ultimaCompra: z.object({ fecha: z.string(), total: z.number() }).nullable(),
    ultimoPago: z.object({ fecha: z.string(), monto: z.number() }).nullable(),
    diasEntreCompras: z.number().nullable(),
    /** Que parte de TODO lo que vendio la marca es de este cliente. */
    porcentajeDeLasVentas: porcentajeSchema,
  }),
  /** Hasta 10, de la que mas unidades le vendio a la que menos. */
  especies: z.array(especieDelClienteSchema).default([]),
});

// ─────────────────── 9. Morosos ───────────────────

/**
 * Un punto de la evolucion: la foto al FINAL del tramo (el tramo en curso se
 * corta en el momento de la consulta). `morosos` = el del punto anterior +
 * `nuevos` - `recuperados`.
 */
export const puntoMorososSchema = z.object({
  /** `2026-04` por mes; por semana, el lunes: `2026-08-31`. */
  etiqueta: z.string(),
  /** Los dias que cubre. El primero y el ultimo pueden quedar cortados por el periodo. */
  desde: z.string(),
  hasta: z.string(),
  morosos: z.number(),
  /** Los que entraron: no eran morosos al final del tramo anterior y ahora si. */
  nuevos: z.number(),
  /** Los que salieron: pagaron, o se les reprogramo la fecha. */
  recuperados: z.number(),
  montoVencido: z.number(),
});

/** Un moroso de hoy: su factura activa, vencida y con deuda. */
export const morosoSchema = z.object({
  posicion: z.number(),
  /** El id de su factura activa. */
  factura: z.string(),
  cliente: clienteRenglonSchema,
  /** Lo que debe. Todo esta vencido, tambien lo que se llevo despues de vencer. */
  saldo: z.number(),
  totalFiado: z.number(),
  totalPagos: z.number(),
  cumplimiento: z.number().nullish(),
  venceEl: z.string(),
  /** Si se le cambio la fecha, la primera que se habia acordado. */
  vencimientoOriginal: z.string().nullish(),
  reprogramada: z.boolean().default(false),
  /** Desde `venceEl`. Vencida hace unas horas ya cuenta 1. */
  diasDeAtraso: z.number(),
  /** Su ultimo ticket. Si es reciente, sigue comprando con la cuenta vencida. */
  ultimaCompra: z.object({ fecha: z.string(), total: z.number() }).nullish(),
  /** Su ultimo pago a cuenta, de cualquier factura. `null` = nunca pago a cuenta. */
  ultimoPago: z.object({ fecha: z.string(), monto: z.number().optional() }).nullish(),
  /** Dias desde `ultimoPago`. `null` si nunca pago. */
  diasSinPagar: z.number().nullish(),
});

export const paginaMorososSchema = z.object({
  periodo: periodoSchema,
  agrupar: agruparSchema,
  /** De TODA la marca: no cambia con la busqueda. */
  resumen: z.object({
    /** Los morosos de HOY. */
    morosos: z.number(),
    /** Cuantos clientes tiene la marca. */
    clientes: z.number(),
    /** `morosos / clientes`: "el 41,7% de tus clientes esta atrasado". */
    porcentajeDeClientes: porcentajeSchema,
    montoVencido: z.number(),
    /** Cuanto hace, en promedio, que vencieron. `null` si no hay morosos. */
    diasPromedioDeAtraso: z.number().nullable(),
    /** Cuantos habia justo antes de `desde`. */
    alInicioDelPeriodo: z.number(),
    /** Los del final del periodo menos los del principio: `+4` = hay 4 mas. */
    variacionEnElPeriodo: z.number(),
  }),
  /** Tambien de toda la marca: la busqueda solo filtra la lista. */
  evolucion: z.array(puntoMorososSchema),
  /** La lista de hoy, paginada. Es la unica parte que filtra `buscar`. */
  morosos: z.object({ datos: z.array(morosoSchema), ...camposPaginado }),
});
