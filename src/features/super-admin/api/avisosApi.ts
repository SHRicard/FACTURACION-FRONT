import { baseApi } from '@/services/api';

import {
  alcanceAvisosSchema,
  avisoAdminSchema,
  detalleAvisoSchema,
  mensajeSchema,
  paginaAvisosSchema,
  resultadoPruebaSchema,
} from '../schemas';
import type {
  AlcanceAvisos,
  AvisoAdmin,
  DetalleAviso,
  Mensaje,
  NuevoAvisoForm,
  PaginaAvisos,
  ResultadoPrueba,
} from '../types';

const POR_PAGINA = 20;

const id = (valor: string) => encodeURIComponent(valor);

/**
 * Los avisos que manda el super_admin como notificacion push a todos los
 * telefonos (docs/NOTIFICACIONES.md, 7).
 *
 * 'AdminAviso' es el historial y el detalle; 'Aviso' es la lista que ve la
 * app: mandar o borrar uno cambia las dos.
 */
export const avisosApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** A cuantos telefonos le llegaria un aviso ahora. */
    alcanceAvisos: build.query<AlcanceAvisos, void>({
      query: () => ({ url: '/admin/avisos/alcance' }),
      transformResponse: (respuesta: unknown) => alcanceAvisosSchema.parse(respuesta),
      providesTags: [{ type: 'AdminAviso', id: 'ALCANCE' }],
    }),

    listarAvisosAdmin: build.infiniteQuery<PaginaAvisos, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (ultima) =>
          ultima.pagina < ultima.paginas ? ultima.pagina + 1 : undefined,
        refetchCachedPages: true,
      },
      query: ({ pageParam }) => ({
        url: '/admin/avisos',
        params: { pagina: pageParam, porPagina: POR_PAGINA },
      }),
      transformResponse: (respuesta: unknown) => paginaAvisosSchema.parse(respuesta),
      providesTags: (resultado) => [
        { type: 'AdminAviso' as const, id: 'LISTA' },
        ...(resultado?.pages ?? []).flatMap((pagina) =>
          pagina.datos.map((aviso) => ({ type: 'AdminAviso' as const, id: aviso.id })),
        ),
      ],
    }),

    detalleAvisoAdmin: build.query<DetalleAviso, string>({
      query: (avisoId) => ({ url: `/admin/avisos/${id(avisoId)}` }),
      transformResponse: (respuesta: unknown) => detalleAvisoSchema.parse(respuesta),
      providesTags: (_resultado, _error, avisoId) => [{ type: 'AdminAviso', id: avisoId }],
    }),

    /** Solo a los telefonos del super_admin. No se guarda ni aparece en la app. */
    enviarPruebaAviso: build.mutation<ResultadoPrueba, NuevoAvisoForm>({
      query: (body) => ({ url: '/admin/avisos/prueba', method: 'POST', body }),
      transformResponse: (respuesta: unknown) => resultadoPruebaSchema.parse(respuesta),
    }),

    /** 202: queda guardado y se manda en segundo plano. No se puede deshacer. */
    crearAviso: build.mutation<AvisoAdmin, NuevoAvisoForm>({
      query: (body) => ({ url: '/admin/avisos', method: 'POST', body }),
      transformResponse: (respuesta: unknown) => avisoAdminSchema.parse(respuesta),
      invalidatesTags: [{ type: 'AdminAviso', id: 'LISTA' }, 'Aviso'],
    }),

    /** Solo un aviso `fallido`: sigue desde donde quedo. */
    reintentarAviso: build.mutation<DetalleAviso, string>({
      query: (avisoId) => ({ url: `/admin/avisos/${id(avisoId)}/reintentar`, method: 'POST' }),
      transformResponse: (respuesta: unknown) => detalleAvisoSchema.parse(respuesta),
      invalidatesTags: (_resultado, _error, avisoId) => [
        { type: 'AdminAviso', id: avisoId },
        { type: 'AdminAviso', id: 'LISTA' },
      ],
    }),

    /**
     * Lo saca del historial y de la app. La notificacion que ya llego no se
     * borra. No invalida su propio id: la ficha montada volveria como 404.
     */
    borrarAviso: build.mutation<Mensaje, string>({
      query: (avisoId) => ({ url: `/admin/avisos/${id(avisoId)}`, method: 'DELETE' }),
      transformResponse: (respuesta: unknown) => mensajeSchema.parse(respuesta),
      invalidatesTags: [{ type: 'AdminAviso', id: 'LISTA' }, 'Aviso'],
    }),
  }),
});

export const {
  useAlcanceAvisosQuery,
  useListarAvisosAdminInfiniteQuery,
  useDetalleAvisoAdminQuery,
  useEnviarPruebaAvisoMutation,
  useCrearAvisoMutation,
  useReintentarAvisoMutation,
  useBorrarAvisoMutation,
} = avisosApi;
