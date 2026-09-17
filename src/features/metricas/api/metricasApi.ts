import { baseApi } from '@/services/api';

import {
  detalleEspecieSchema,
  mejoresClientesSchema,
  pagosATiempoSchema,
  paginaDeudoresSchema,
  paginaFrecuenciaSchema,
  paginaInactivosSchema,
  paginaMorososSchema,
  perfilClienteSchema,
  tasaCobranzaSchema,
  ventasPorEspecieSchema,
} from '../schemas';
import type {
  DetalleEspecie,
  FiltrosDeudores,
  FiltrosDetalleEspecie,
  FiltrosEspecies,
  FiltrosFrecuencia,
  FiltrosInactivos,
  FiltrosMejores,
  FiltrosMorosos,
  MejoresClientes,
  PagosATiempo,
  PaginaDeudores,
  PaginaFrecuencia,
  PaginaInactivos,
  PaginaMorosos,
  PerfilCliente,
  Periodo,
  TasaCobranza,
  VentasPorEspecie,
} from '../types';

/** Cuantos renglones trae cada pagina. El backend acepta hasta 100. */
const POR_PAGINA = 20;

type ValorQuery = string | number | boolean | undefined;

/**
 * Arma el query string mandando SOLO lo que tiene valor.
 *
 * Sin este filtro la URL se llena de `buscar=&morosos=false`, que ademas parte
 * la cache de RTK Query en entradas distintas para pedidos equivalentes.
 */
function armarQuery(valores: Record<string, ValorQuery>): string {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(valores)) {
    if (valor === undefined || valor === false || valor === '') continue;
    params.set(clave, String(valor));
  }
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

/** Lo que va en la query de una pagina: la primera no manda `pagina`. */
const paginado = (pagina: number) => ({
  pagina: pagina > 1 ? pagina : undefined,
  porPagina: POR_PAGINA,
});

/** Mismo criterio que los listados: `undefined` apaga el `hasNextPage`. */
const siguientePagina = (ultima: { pagina: number; paginas: number }) =>
  ultima.pagina < ultima.paginas ? ultima.pagina + 1 : undefined;

/**
 * Las opciones de las listas con scroll infinito. Al recargar se pide SOLO la
 * primera pagina: sin `refetchCachedPages: false` RTK Query re-pide en fila
 * todas las que el usuario llego a scrollear.
 */
const opcionesInfinitas = {
  initialPageParam: 1,
  getNextPageParam: siguientePagina,
  refetchCachedPages: false,
} as const;

/**
 * Todas llevan el mismo tag: no hay nada guardado del lado del servidor, cada
 * pedido cuenta desde los tickets, las facturas y los pagos de ese momento. El
 * tag esta para que el "refrescar todo" de la app las alcance.
 */
const TAG_METRICA = [{ type: 'Metrica' as const, id: 'TODAS' }];

/**
 * Los numeros del negocio: una ruta por metrica, una pantalla por ruta.
 *
 * Los anulados no cuentan nunca; eso lo resuelve el backend.
 */
export const metricasApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    tasaCobranza: build.query<TasaCobranza, Periodo>({
      query: ({ desde, hasta }) => ({
        url: `/metricas/tasa-cobranza${armarQuery({ desde, hasta })}`,
      }),
      transformResponse: (respuesta: unknown) => tasaCobranzaSchema.parse(respuesta),
      providesTags: TAG_METRICA,
    }),

    /** El periodo es el de VENCIMIENTO de las facturas, no el de pago. */
    pagosATiempo: build.query<PagosATiempo, Periodo>({
      query: ({ desde, hasta }) => ({
        url: `/metricas/pagos-a-tiempo${armarQuery({ desde, hasta })}`,
      }),
      transformResponse: (respuesta: unknown) => pagosATiempoSchema.parse(respuesta),
      providesTags: TAG_METRICA,
    }),

    /**
     * Deudores: cuanta plata hay en la calle y quien la tiene. El resumen y la
     * evolucion son de toda la marca; `buscar` filtra solo la lista.
     *
     * `desde`, `hasta` y `agrupar` son para la evolucion, que el backend
     * todavia no manda: ver `docs/DEUDORES.md`. Viajan igual, asi el dia que
     * exista no hay que tocar nada.
     */
    deudores: build.infiniteQuery<PaginaDeudores, FiltrosDeudores, number>({
      infiniteQueryOptions: opcionesInfinitas,
      query: ({ queryArg, pageParam }) => ({
        url: `/metricas/deudores${armarQuery({
          desde: queryArg.desde,
          hasta: queryArg.hasta,
          agrupar: queryArg.agrupar,
          orden: queryArg.orden,
          buscar: queryArg.buscar.trim(),
          ...paginado(pageParam),
        })}`,
      }),
      transformResponse: (respuesta: unknown) => paginaDeudoresSchema.parse(respuesta),
      providesTags: TAG_METRICA,
    }),

    /**
     * Morosos: el resumen, la evolucion y la lista de hoy vienen en la MISMA
     * respuesta. Lo que se pagina es la lista; el resumen y la evolucion llegan
     * iguales en cada pagina y se leen de la primera.
     */
    morosos: build.infiniteQuery<PaginaMorosos, FiltrosMorosos, number>({
      infiniteQueryOptions: {
        ...opcionesInfinitas,
        // La paginacion viene adentro de `morosos`, no en la raiz de la respuesta.
        getNextPageParam: (ultima) => siguientePagina(ultima.morosos),
      },
      query: ({ queryArg, pageParam }) => ({
        url: `/metricas/morosos${armarQuery({
          desde: queryArg.desde,
          hasta: queryArg.hasta,
          agrupar: queryArg.agrupar,
          orden: queryArg.orden,
          buscar: queryArg.buscar.trim(),
          ...paginado(pageParam),
        })}`,
      }),
      transformResponse: (respuesta: unknown) => paginaMorososSchema.parse(respuesta),
      providesTags: TAG_METRICA,
    }),

    clientesInactivos: build.infiniteQuery<PaginaInactivos, FiltrosInactivos, number>({
      infiniteQueryOptions: opcionesInfinitas,
      query: ({ queryArg, pageParam }) => ({
        url: `/metricas/clientes-inactivos${armarQuery({
          dias: queryArg.dias,
          orden: queryArg.orden,
          ...paginado(pageParam),
        })}`,
      }),
      transformResponse: (respuesta: unknown) => paginaInactivosSchema.parse(respuesta),
      providesTags: TAG_METRICA,
    }),

    /** Un ranking corto (10 por defecto), sin paginar. */
    mejoresClientes: build.query<MejoresClientes, FiltrosMejores>({
      query: ({ desde, hasta, orden }) => ({
        url: `/metricas/mejores-clientes${armarQuery({ desde, hasta, orden })}`,
      }),
      transformResponse: (respuesta: unknown) => mejoresClientesSchema.parse(respuesta),
      providesTags: TAG_METRICA,
    }),

    /**
     * El perfil de un cliente: que tan confiable es y cuanto vale.
     *
     * ⚠️ Todavia no existe en el backend: es el contrato que le pedimos en
     * `docs/PERFIL_CLIENTE.md`. Hasta entonces responde 404 "Ruta no
     * encontrada" y la pantalla lo avisa.
     *
     * Sin periodo a proposito: el cumplimiento de un cliente se juzga con TODAS
     * sus facturas. Lleva tambien el tag del cliente: un ticket o un pago suyo
     * cambian estos numeros.
     */
    perfilCliente: build.query<PerfilCliente, string>({
      query: (id) => ({ url: `/clientes/${encodeURIComponent(id)}/perfil` }),
      transformResponse: (respuesta: unknown) => perfilClienteSchema.parse(respuesta),
      providesTags: (_resultado, _error, id) => [...TAG_METRICA, { type: 'Cliente' as const, id }],
    }),

    frecuenciaCompra: build.infiniteQuery<PaginaFrecuencia, FiltrosFrecuencia, number>({
      infiniteQueryOptions: opcionesInfinitas,
      query: ({ queryArg, pageParam }) => ({
        url: `/metricas/frecuencia-compra${armarQuery({
          desde: queryArg.desde,
          hasta: queryArg.hasta,
          estado: queryArg.estado,
          orden: queryArg.orden,
          ...paginado(pageParam),
        })}`,
      }),
      transformResponse: (respuesta: unknown) => paginaFrecuenciaSchema.parse(respuesta),
      providesTags: TAG_METRICA,
    }),

    /** El ranking: cuanto se vendio de cada especie, en unidades o en plata. */
    ventasPorEspecie: build.query<VentasPorEspecie, FiltrosEspecies>({
      query: ({ desde, hasta, orden }) => ({
        url: `/metricas/ventas-por-especie${armarQuery({ desde, hasta, orden })}`,
      }),
      transformResponse: (respuesta: unknown) => ventasPorEspecieSchema.parse(respuesta),
      providesTags: TAG_METRICA,
    }),

    /** Una especie sola: mes a mes, talles y articulos. Una especie ajena es 404. */
    detalleEspecie: build.query<DetalleEspecie, FiltrosDetalleEspecie>({
      query: ({ especie, desde, hasta }) => ({
        url: `/metricas/ventas-por-especie/${encodeURIComponent(especie)}${armarQuery({ desde, hasta })}`,
      }),
      transformResponse: (respuesta: unknown) => detalleEspecieSchema.parse(respuesta),
      providesTags: TAG_METRICA,
    }),
  }),
});

export const {
  useTasaCobranzaQuery,
  usePagosATiempoQuery,
  useDeudoresInfiniteQuery,
  useMorososInfiniteQuery,
  useClientesInactivosInfiniteQuery,
  useMejoresClientesQuery,
  usePerfilClienteQuery,
  useFrecuenciaCompraInfiniteQuery,
  useVentasPorEspecieQuery,
  useDetalleEspecieQuery,
} = metricasApi;
