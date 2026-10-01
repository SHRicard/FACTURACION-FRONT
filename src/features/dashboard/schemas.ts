import { z } from 'zod';

/**
 * `GET /metricas/resumen`: todo el Inicio en una sola llamada.
 *
 * Ver `docs/dashboard_metricas.md` §4. Viene junto a proposito: es la primera
 * pantalla que se abre, y seis llamadas separadas la harian tardar seis veces
 * mas.
 */

/** Mongo llama `_id` a la clave primaria. Se renombra en esta capa y nada mas. */
const aId = <T extends { _id: string }>({ _id, ...resto }: T) => ({ id: _id, ...resto });

/** Un porcentaje con un decimal, o `null` cuando no hay base: se muestra `—`. */
const porcentajeSchema = z.number().nullable();

/**
 * El cliente de cada renglon.
 *
 * Va `nullable` porque el backend lo resuelve con un lookup que conserva los
 * vacios: un cliente borrado de la base deja su deuda sin nombre, y eso no
 * tiene por que romper la pantalla entera.
 */
const clienteDelResumenSchema = z
  .object({
    _id: z.string(),
    nombre: z.string(),
    dni: z.string(),
    telefono: z.string().optional(),
  })
  .transform(aId)
  .nullable();

/** Una factura de la cobranza: la que ya vencio, o la que esta por vencer. */
const facturaDeCobranzaSchema = z.object({
  factura: z.string(),
  cliente: clienteDelResumenSchema,
  saldo: z.number(),
  venceEl: z.string(),
  /** Positivo: dias de atraso. Negativo: dias que faltan para vencer. */
  dias: z.number(),
});

/** Debe y hace rato que no compra: la plata que mas facil se pierde. */
const clienteQueSeFueSchema = z.object({
  cliente: clienteDelResumenSchema,
  saldo: z.number(),
  ultimaCompra: z.object({ fecha: z.string(), total: z.number() }).nullable(),
  diasSinComprar: z.number().nullable(),
});

/** Ya debe mas de lo que se le habia puesto como tope. */
const clienteExcedidoSchema = z.object({
  cliente: clienteDelResumenSchema,
  saldo: z.number(),
  limiteCredito: z.number(),
  /** Por cuanto se paso. */
  excedido: z.number(),
});

/** Las cuatro listas de cobranza traen la misma forma. */
const listaCortaSchema = <T extends z.ZodTypeAny>(renglon: T) =>
  z.object({
    clientes: z.number(),
    monto: z.number(),
    /** Los peores, hasta `limite`. La tarjeta se esconde con `clientes` en 0. */
    top: z.array(renglon).default([]),
  });

/** Lo que se movio en un periodo: lo que salio por la puerta y lo que entro. */
const movimientoSchema = z.object({
  desde: z.string(),
  hasta: z.string(),
  vendido: z.number(),
  /** De lo vendido, cuanto quedo anotado. */
  fiado: z.number(),
  /** Todo lo que entro: lo del mostrador mas los pagos a cuenta. */
  cobrado: z.number(),
  tickets: z.number(),
  clientes: z.number(),
});

/**
 * Un movimiento de la marca: una compra o un pago, sin anulados.
 *
 * Un tipo de movimiento nuevo del backend cae en 'desconocido' y se saltea (ver
 * `actividad` en `resumenDashboardSchema`) en vez de romper el Inicio (K8).
 */
export const actividadSchema = z
  .object({
    tipo: z.enum(['compra', 'pago', 'desconocido']).catch('desconocido'),
    _id: z.string(),
    fecha: z.string(),
    cliente: clienteDelResumenSchema,
    monto: z.number(),
    /** `null` en las compras. */
    metodoPago: z.string().nullish(),
    /** Quien lo cargo. Con dos duenos sirve para ver que hizo el otro. */
    registradoPor: z.object({ _id: z.string(), nombre: z.string() }).transform(aId).nullish(),
  })
  .transform(aId);

export const resumenDashboardSchema = z.object({
  generadoEl: z.string(),
  /** "Que tengo que hacer": lo accionable. */
  cobranza: z.object({
    /** Lo que ya vencio y sigue impago. */
    vencido: listaCortaSchema(facturaDeCobranzaSchema),
    /** Lo que vence en los proximos `dias`: para avisar ANTES. */
    porVencer: listaCortaSchema(facturaDeCobranzaSchema).extend({ dias: z.number() }),
    /** Deben y hace mas de `dias` que no compran. */
    seFueronDebiendo: listaCortaSchema(clienteQueSeFueSchema).extend({ dias: z.number() }),
    pasaronElLimite: listaCortaSchema(clienteExcedidoSchema),
  }),
  /** "Como viene": el mes contra el anterior, y la plata en la calle. */
  negocio: z.object({
    /** Del 1 hasta hoy. */
    mes: movimientoSchema,
    /** El MISMO tramo del mes pasado: comparar 16 dias contra 31 enganaria. */
    mesAnterior: movimientoSchema,
    /** Cuanto cambio contra el mes anterior, en %. `null` si el anterior fue 0. */
    variacion: z.object({ vendido: porcentajeSchema, cobrado: porcentajeSchema }),
    /** La ventana corta: los ultimos `dias` dias. */
    semana: movimientoSchema.extend({ dias: z.number() }),
    deuda: z.object({
      total: z.number(),
      vencida: z.number(),
      alInicioDeLaCurva: z.number(),
      /** Cuanto crecio (+) o bajo (-) desde el principio de la curva. */
      variacion: z.number(),
      porMes: z
        .array(
          z.object({
            mes: z.string(),
            deudaTotal: z.number(),
            deudaVencida: z.number(),
            deudores: z.number(),
          }),
        )
        .default([]),
    }),
  }),
  /** Las especies del mes con mas plata. */
  masVendido: z
    .array(
      z.object({
        especie: z
          .object({ _id: z.string().nullable(), nombre: z.string().nullable() })
          .transform(({ _id, nombre }) => ({ id: _id, nombre: nombre ?? 'Sin especie' })),
        unidades: z.number(),
        monto: z.number(),
        porcentajeMonto: porcentajeSchema,
      }),
    )
    .default([]),
  /** Los de mejor cumplimiento de toda su historia. */
  mejoresClientes: z
    .array(
      z.object({
        posicion: z.number(),
        cliente: clienteDelResumenSchema,
        cumplimiento: porcentajeSchema,
        evaluadas: z.number(),
        comprado: z.number(),
      }),
    )
    .default([]),
  /**
   * Los de tipo 'desconocido' se filtran acá, en el schema, para que ni
   * DashboardMovil ni FilaActividad tengan que saber que existen (K8).
   */
  actividad: z
    .array(actividadSchema)
    .default([])
    .transform((lista) => lista.filter((movimiento) => movimiento.tipo !== 'desconocido')),
});
