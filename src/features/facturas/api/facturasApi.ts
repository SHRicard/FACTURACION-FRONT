import { baseApi } from '@/services/api';

import { facturaDetalleSchema, listaVencidasSchema, paginaFacturasSchema } from '../schemas';
import type { FacturaDetalle, FacturaEnLista, FiltrosFacturas, PaginaFacturas } from '../types';

/** Cuantas facturas trae cada pagina. El backend acepta hasta 100. */
const POR_PAGINA = 20;

/**
 * Arma el query string mandando SOLO lo que tiene valor.
 *
 * Sin este filtro la URL se llena de `buscar=&vencidas=false`, que ademas parte
 * la cache de RTK Query en entradas distintas para busquedas equivalentes.
 */
function armarQuery(filtros: FiltrosFacturas, pagina: number): string {
  const params = new URLSearchParams();

  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.cliente) params.set('cliente', filtros.cliente);
  if (filtros.vencidas) params.set('vencidas', 'true');

  const buscar = filtros.buscar?.trim();
  if (buscar) params.set('buscar', buscar);
  if (pagina > 1) params.set('pagina', String(pagina));
  params.set('porPagina', String(filtros.porPagina ?? POR_PAGINA));

  return `?${params.toString()}`;
}

/**
 * Endpoints de facturacion. Solo lectura: cerrar, marcar pagada y registrar
 * pagos son la etapa de cobranza y van aparte.
 */
export const facturasApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Listado con scroll infinito.
     *
     * Es una `infiniteQuery` y no una query comun: asi RTK Query acumula las
     * paginas en una sola entrada de cache, y `refetch` (el de tirar para
     * abajo) vuelve a pedir todas las cargadas en vez de tirar al usuario de
     * vuelta a la primera.
     */
    listarFacturas: build.infiniteQuery<PaginaFacturas, FiltrosFacturas, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        // `undefined` = no hay mas: es lo que apaga el `hasNextPage` del hook.
        getNextPageParam: (ultima) =>
          ultima.pagina < ultima.paginas ? ultima.pagina + 1 : undefined,
      },
      query: ({ queryArg, pageParam }) => ({ url: `/facturas${armarQuery(queryArg, pageParam)}` }),
      transformResponse: (respuesta: unknown) => paginaFacturasSchema.parse(respuesta),
      providesTags: (resultado) => [
        { type: 'Factura' as const, id: 'LISTA' },
        ...(resultado?.pages ?? []).flatMap((pagina) =>
          pagina.datos.map((factura) => ({ type: 'Factura' as const, id: factura.id })),
        ),
      ],
    }),

    /** La cuenta entera de un periodo: la factura, sus tickets y sus pagos. */
    facturaDetalle: build.query<FacturaDetalle, string>({
      query: (id) => ({ url: `/facturas/${encodeURIComponent(id)}` }),
      transformResponse: (respuesta: unknown) => facturaDetalleSchema.parse(respuesta),
      providesTags: (_resultado, _error, id) => [{ type: 'Factura', id }],
    }),

    /**
     * La cola de cobranza: las que pasaron su fecha y siguen con saldo, la mas
     * atrasada primero. Array plano, sin paginar.
     */
    facturasVencidas: build.query<FacturaEnLista[], void>({
      query: () => ({ url: '/facturas/vencidas' }),
      transformResponse: (respuesta: unknown) => listaVencidasSchema.parse(respuesta),
      providesTags: [{ type: 'Factura', id: 'VENCIDAS' }],
    }),
  }),
});

export const { useListarFacturasInfiniteQuery, useFacturaDetalleQuery, useFacturasVencidasQuery } =
  facturasApi;
