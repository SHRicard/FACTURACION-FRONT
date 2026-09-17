import { baseApi } from '@/services/api';

import {
  bajaEnlacesSchema,
  enlaceFacturaSchema,
  envioFacturaSchema,
  facturaDetalleSchema,
  facturaSchema,
  listaVencidasSchema,
  paginaFacturasSchema,
} from '../schemas';
import type {
  BajaEnlaces,
  EnlaceFactura,
  EnvioFactura,
  Factura,
  FacturaDetalle,
  FacturaEnLista,
  FiltrosFacturas,
  PaginaFacturas,
} from '../types';

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
 * Endpoints de facturacion: leerlas y mandarselas al cliente. Cerrar, marcar
 * pagada y registrar pagos son la etapa de cobranza y van aparte.
 *
 * El PDF no esta aca: se baja directo a un archivo (`useEnviarFactura`), no es
 * JSON y no tiene nada que cachear.
 */
export const facturasApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Listado con scroll infinito.
     *
     * Es una `infiniteQuery`: RTK Query acumula las paginas en una sola entrada de
     * cache a medida que se scrollea. Al recargar vuelve a la primera pagina
     * (`refetchCachedPages: false`): una sola request, no una por pagina cargada.
     */
    listarFacturas: build.infiniteQuery<PaginaFacturas, FiltrosFacturas, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        // `undefined` = no hay mas: es lo que apaga el `hasNextPage` del hook.
        getNextPageParam: (ultima) =>
          ultima.pagina < ultima.paginas ? ultima.pagina + 1 : undefined,
        // Al recargar (tirar para abajo, o un tag invalidado) se pide SOLO la
        // primera pagina. Sin esto RTK Query re-pide en fila todas las que el
        // usuario llego a scrollear: 6 requests en vez de 1.
        refetchCachedPages: false,
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

    /**
     * El link publico (7 dias) y el mensaje de WhatsApp ya escrito. Generar uno
     * nuevo NO mata los anteriores. Sin tags: no cambia nada de la cuenta.
     */
    enlaceFactura: build.mutation<EnlaceFactura, string>({
      query: (id) => ({
        url: `/facturas/${encodeURIComponent(id)}/enlace`,
        method: 'POST',
        body: {},
      }),
      transformResponse: (respuesta: unknown) => enlaceFacturaSchema.parse(respuesta),
    }),

    /** Por mail, con el PDF adjunto. Sin email, va al del cliente. */
    enviarFacturaPorMail: build.mutation<
      EnvioFactura,
      { id: string; email?: string; mensaje?: string }
    >({
      query: ({ id, ...cuerpo }) => ({
        url: `/facturas/${encodeURIComponent(id)}/enviar`,
        method: 'POST',
        body: cuerpo,
      }),
      transformResponse: (respuesta: unknown) => envioFacturaSchema.parse(respuesta),
    }),

    /** Todos los links mandados de esta factura dejan de abrir, al toque. */
    darDeBajaEnlaces: build.mutation<BajaEnlaces, string>({
      query: (id) => ({ url: `/facturas/${encodeURIComponent(id)}/enlace`, method: 'DELETE' }),
      transformResponse: (respuesta: unknown) => bajaEnlacesSchema.parse(respuesta),
    }),

    /**
     * "Te pago el 30": la nueva fecha acordada, `aaaa-mm-dd`. Solo en la activa
     * y con tickets. El cumplimiento NO cambia: se mide contra la original.
     */
    reprogramarVencimiento: build.mutation<
      Factura,
      { id: string; clienteId: string; venceEl: string }
    >({
      query: ({ id, venceEl }) => ({
        url: `/facturas/${encodeURIComponent(id)}/vencimiento`,
        method: 'PUT',
        body: { venceEl },
      }),
      transformResponse: (respuesta: unknown) => facturaSchema.parse(respuesta),
      invalidatesTags: (_resultado, _error, { id, clienteId }) => [
        { type: 'Factura', id },
        { type: 'Factura', id: 'LISTA' },
        // Deja de figurar vencida: cambia la cola de cobranza y el cliente.
        { type: 'Factura', id: 'VENCIDAS' },
        { type: 'Cliente', id: clienteId },
        { type: 'Cliente', id: 'LISTA' },
        { type: 'Metrica', id: 'TODAS' },
      ],
    }),

    /**
     * Cerrarla a mano. Solo para el caso raro de una factura en $0 SIN pagos a
     * cuenta (todo se pago en el mostrador): el pago que la deja en cero ya la
     * cierra solo. Con deuda, el backend responde 400.
     */
    cerrarFactura: build.mutation<Factura, { id: string; clienteId: string }>({
      query: ({ id }) => ({ url: `/facturas/${encodeURIComponent(id)}/pagada`, method: 'PUT' }),
      transformResponse: (respuesta: unknown) => facturaSchema.parse(respuesta),
      invalidatesTags: (_resultado, _error, { id, clienteId }) => [
        { type: 'Factura', id },
        { type: 'Factura', id: 'LISTA' },
        { type: 'Cliente', id: clienteId },
        { type: 'Cliente', id: 'LISTA' },
        { type: 'Metrica', id: 'TODAS' },
      ],
    }),
  }),
});

export const {
  useListarFacturasInfiniteQuery,
  useFacturaDetalleQuery,
  useFacturasVencidasQuery,
  useEnlaceFacturaMutation,
  useEnviarFacturaPorMailMutation,
  useDarDeBajaEnlacesMutation,
  useReprogramarVencimientoMutation,
  useCerrarFacturaMutation,
} = facturasApi;
