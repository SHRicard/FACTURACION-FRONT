import { baseApi } from '@/services/api';

import { clienteDetalleSchema, clienteSchema, paginaClientesSchema } from '../schemas';
import type {
  Cliente,
  ClienteDetalle,
  DatosCliente,
  FiltrosClientes,
  PaginaClientes,
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
     * Es una `infiniteQuery` y no una query comun: asi RTK Query acumula las
     * paginas en una sola entrada de cache, y `refetch` (el de tirar para abajo)
     * vuelve a pedir todas las que estaban cargadas en vez de tirar al usuario
     * de vuelta a la primera.
     */
    listarClientes: build.infiniteQuery<PaginaClientes, FiltrosClientes, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        // `undefined` = no hay mas: es lo que apaga el `hasNextPage` del hook.
        getNextPageParam: (ultima) =>
          ultima.pagina < ultima.paginas ? ultima.pagina + 1 : undefined,
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
  useCrearClienteMutation,
  useEditarClienteMutation,
} = clientesApi;
