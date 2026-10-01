import type { z } from 'zod';

import type {
  agruparSchema,
  clienteInactivoSchema,
  clienteMetricaSchema,
  cumplimientoSchema,
  detalleEspecieSchema,
  deudorSchema,
  especieDelClienteSchema,
  especieVendidaSchema,
  estadoFrecuenciaSchema,
  frecuenciaClienteSchema,
  mejorClienteSchema,
  mejoresClientesSchema,
  mesDeCumplimientoSchema,
  morosoSchema,
  pagosATiempoSchema,
  paginaDeudoresSchema,
  paginaFrecuenciaSchema,
  paginaInactivosSchema,
  paginaMorososSchema,
  perfilClienteSchema,
  periodoSchema,
  puntoDeudoresSchema,
  puntoMorososSchema,
  tasaCobranzaSchema,
  ventasPorEspecieSchema,
} from './schemas';

export type Periodo = z.infer<typeof periodoSchema>;
export type ClienteMetrica = z.infer<typeof clienteMetricaSchema>;

export type TasaCobranza = z.infer<typeof tasaCobranzaSchema>;

export type Cumplimiento = z.infer<typeof cumplimientoSchema>;
export type PagosATiempo = z.infer<typeof pagosATiempoSchema>;

export type Deudor = z.infer<typeof deudorSchema>;
export type PuntoDeudores = z.infer<typeof puntoDeudoresSchema>;
export type PaginaDeudores = z.infer<typeof paginaDeudoresSchema>;

export type ClienteInactivo = z.infer<typeof clienteInactivoSchema>;
export type PaginaInactivos = z.infer<typeof paginaInactivosSchema>;

export type MejorCliente = z.infer<typeof mejorClienteSchema>;
export type MejoresClientes = z.infer<typeof mejoresClientesSchema>;

export type MesDeCumplimiento = z.infer<typeof mesDeCumplimientoSchema>;
export type EspecieDelCliente = z.infer<typeof especieDelClienteSchema>;
export type PerfilCliente = z.infer<typeof perfilClienteSchema>;

export type EstadoFrecuencia = z.infer<typeof estadoFrecuenciaSchema>;
export type FrecuenciaCliente = z.infer<typeof frecuenciaClienteSchema>;
export type PaginaFrecuencia = z.infer<typeof paginaFrecuenciaSchema>;

export type EspecieVendida = z.infer<typeof especieVendidaSchema>;
export type VentasPorEspecie = z.infer<typeof ventasPorEspecieSchema>;
export type DetalleEspecie = z.infer<typeof detalleEspecieSchema>;

export type Agrupar = z.infer<typeof agruparSchema>;
export type PuntoMorosos = z.infer<typeof puntoMorososSchema>;
export type Moroso = z.infer<typeof morosoSchema>;
export type PaginaMorosos = z.infer<typeof paginaMorososSchema>;

// ─────────────────── Lo que se manda ───────────────────

/** Una opcion de un selector de la pantalla: lo que viaja y lo que se lee. */
export interface Opcion<T extends string | number> {
  clave: T;
  etiqueta: string;
}

export type OrdenDeudores = 'saldo' | 'atraso';
export type OrdenInactivos = 'saldo' | 'dias';
export type OrdenMejores = 'cumplimiento' | 'compras';
export type OrdenFrecuencia = 'frecuencia' | 'demorados';
export type OrdenEspecies = 'unidades' | 'monto';
export type OrdenMorosos = 'atraso' | 'saldo';

export interface FiltrosDeudores extends Periodo {
  /** Un punto del grafico por mes o por semana. */
  agrupar: Agrupar;
  orden: OrdenDeudores;
  /** Filtra SOLO la lista: el resumen y la evolucion son de toda la marca. */
  buscar: string;
}

export interface FiltrosInactivos {
  dias: number;
  orden: OrdenInactivos;
}

export interface FiltrosFrecuencia extends Periodo {
  estado?: EstadoFrecuencia;
  orden: OrdenFrecuencia;
}

export interface FiltrosMejores extends Periodo {
  orden: OrdenMejores;
}

export interface FiltrosEspecies extends Periodo {
  orden: OrdenEspecies;
}

export interface FiltrosDetalleEspecie extends Periodo {
  /** El `id` de la especie, el que vino en el ranking. */
  especie: string;
}

export interface FiltrosMorosos extends Periodo {
  agrupar: Agrupar;
  orden: OrdenMorosos;
  /** Filtra SOLO la lista: el resumen y la evolucion siguen siendo de toda la marca. */
  buscar: string;
}
