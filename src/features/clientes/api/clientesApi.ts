import { baseApi } from '@/services/api';

import {
  clienteDetalleSchema,
  clienteSchema,
  paginaClientesSchema,
  paginaHistorialSchema,
} from '../schemas';
import type {
  Cliente,
  ClienteDetalle,
  DatosCliente,
  FiltrosClientes,
  FiltrosHistorial,
  PaginaClientes,
  PaginaHistorial,
} from '../types';

/** Cuantos clientes trae cada pagina. El backend acepta hasta 100. */
const POR_PAGINA = 20;

/**
 * Arma el query string mandando SOLO lo que tiene valor.
 *
 * Sin este filtro la URL se llena de `buscar=&deudores=false`, que ademas parte
 * la cache de RTK Query en entradas distintas para busquedas equivalentes.
 */
function armarQuery(filtros: FiltrosClientes, pagina: number): string {
  const params = new URLSearchParams();

  const buscar = filtros.buscar?.trim();
  if (buscar) params.set('buscar', buscar);
  if (filtros.deudores) params.set('deudores', 'true');
  if (filtros.vencidos) params.set('vencidos', 'true');
  if (pagina > 1) params.set('pagina', String(pagina));
  params.set('porPagina', String(filtros.porPagina ?? POR_PAGINA));

  return `?${params.toString()}`;
}

/** El query del historial: `todos` es el defecto del backend y no viaja. */
function armarQueryHistorial({ tipo }: FiltrosHistorial, pagina: number): string {
  const params = new URLSearchParams();
  if (tipo !== 'todos') params.set('tipo', tipo);
  if (pagina > 1) params.set('pagina', String(pagina));
  params.set('porPagina', String(POR_PAGINA));
  return `?${params.toString()}`;
}

/**
 * Endpoints de clientes. No hay DELETE a proposito: borrar un cliente se lleva
 * su historial de compras y las metricas del periodo. Cuando haga falta sacarlo
 * de la lista va a ser una baja logica, no un borrado.
 */
export const clientesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Listado con scroll infinito.
     *
     * Es una `infiniteQuery`: RTK Query acumula las paginas en una sola entrada de
     * cache a medida que se scrollea. Al recargar vuelve a la primera pagina
     * (`refetchCachedPages: false`): una sola request, no una por pagina cargada.
     */
    listarClientes: build.infiniteQuery<PaginaClientes, FiltrosClientes, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        // `undefined` = no hay mas: es lo que apaga el `hasNextPage` del hook.
        getNextPageParam: (ultima) =>
          ultima.pagina < ultima.paginas ? ultima.pagina + 1 : undefined,
        // Al recargar (tirar para abajo, o un tag invalidado) se pide SOLO la
        // primera pagina. Sin esto RTK Query re-pide en fila todas las que el
        // usuario llego a scrollear: una request por pagina cargada.
        refetchCachedPages: false,
      },
      query: ({ queryArg, pageParam }) => ({ url: `/clientes${armarQuery(queryArg, pageParam)}` }),
      transformResponse: (respuesta: unknown) => paginaClientesSchema.parse(respuesta),
      providesTags: (resultado) => [
        { type: 'Cliente' as const, id: 'LISTA' },
        ...(resultado?.pages ?? []).flatMap((pagina) =>
          pagina.datos.map((cliente) => ({ type: 'Cliente' as const, id: cliente.id })),
        ),
      ],
    }),

    clienteDetalle: build.query<ClienteDetalle, string>({
      query: (id) => ({ url: `/clientes/${encodeURIComponent(id)}` }),
      transformResponse: (respuesta: unknown) => clienteDetalleSchema.parse(respuesta),
      providesTags: (_resultado, _error, id) => [{ type: 'Cliente', id }],
    }),

    /**
     * El historial completo: resumen, sus facturas y todos sus movimientos
     * (compras y pagos), paginados del mas nuevo al mas viejo. El resumen y las
     * facturas vienen iguales en cada pagina y se leen de la primera.
     *
     * ⚠️ Todavia no existe en el backend: es el contrato que le pedimos en
     * `docs/HISTORIAL_CLIENTE.md`. Hasta entonces responde 404 "Ruta no
     * encontrada" y la pantalla lo avisa.
     *
     * Lleva el tag del cliente: un ticket, un pago o una anulacion lo invalidan,
     * asi que el historial se re-pide solo.
     */
    historialCliente: build.infiniteQuery<PaginaHistorial, FiltrosHistorial, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        // La paginacion viene adentro de `movimientos`, no en la raiz.
        getNextPageParam: ({ movimientos }) =>
          movimientos.pagina < movimientos.paginas ? movimientos.pagina + 1 : undefined,
        // Al recargar se pide SOLO la primera pagina, como en el listado.
        refetchCachedPages: false,
      },
      query: ({ queryArg, pageParam }) => ({
        url: `/clientes/${encodeURIComponent(queryArg.id)}/historial${armarQueryHistorial(queryArg, pageParam)}`,
      }),
      transformResponse: (respuesta: unknown) => paginaHistorialSchema.parse(respuesta),
      providesTags: (_resultado, _error, { id }) => [{ type: 'Cliente' as const, id }],
    }),

    /** El backend le abre la primera factura solo: la respuesta ya la trae. */
    crearCliente: build.mutation<ClienteDetalle, DatosCliente>({
      query: (datos) => ({ url: '/clientes', method: 'POST', body: datos }),
      transformResponse: (respuesta: unknown) => clienteDetalleSchema.parse(respuesta),
      invalidatesTags: [{ type: 'Cliente', id: 'LISTA' }],
    }),

    /**
     * Edicion PARCIAL: lo que no se manda queda como esta, no se borra.
     *
     * Invalida tambien la lista porque un cambio de nombre o de limite se ve
     * en la fila del listado.
     */
    editarCliente: build.mutation<Cliente, { id: string; cambios: Partial<DatosCliente> }>({
      query: ({ id, cambios }) => ({
        url: `/clientes/${encodeURIComponent(id)}`,
        method: 'PUT',
        body: cambios,
      }),
      transformResponse: (respuesta: unknown) => clienteSchema.parse(respuesta),
      invalidatesTags: (_resultado, _error, { id }) => [
        { type: 'Cliente', id },
        { type: 'Cliente', id: 'LISTA' },
      ],
    }),
  }),
});

export const {
  useListarClientesInfiniteQuery,
  useClienteDetalleQuery,
  useHistorialClienteInfiniteQuery,
  useCrearClienteMutation,
  useEditarClienteMutation,
} = clientesApi;
