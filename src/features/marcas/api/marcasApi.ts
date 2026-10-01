import { baseApi } from '@/services/api';

import {
  firmaLogoSchema,
  marcaSchema,
  respuestaIrmeSchema,
  respuestaPerfilSchema,
} from '../schemas';
import type { DatosMarca, FirmaLogo, Marca, RespuestaIrme, RespuestaPerfil } from '../types';

const aMarca = (respuesta: unknown) => marcaSchema.parse(respuesta);

/**
 * La marca: el negocio dentro de la app, con sus duenos (todos iguales).
 *
 * Tambien vive aca la carga del DNI (`/auth/me/perfil`): es el primer paso de
 * la bienvenida y existe solo para poder crear una marca o sumarse a una.
 *
 * Toda mutacion responde la marca entera ya actualizada, asi que se escribe
 * derecho en la cache de `/marcas/mia` en vez de pedirla de nuevo.
 */
export const marcasApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** El DNI, UNA sola vez. Acepta "30.111.222"; el backend lo normaliza. */
    completarPerfil: build.mutation<RespuestaPerfil, string>({
      query: (dni) => ({ url: '/auth/me/perfil', method: 'PUT', body: { dni } }),
      transformResponse: (respuesta: unknown) => respuestaPerfilSchema.parse(respuesta),
      invalidatesTags: ['Usuario'],
    }),

    /** Crear la marca propia, con sus colores. Quien la crea queda como primer dueno. */
    crearMarca: build.mutation<Marca, DatosMarca>({
      query: (datos) => ({ url: '/marcas', method: 'POST', body: datos }),
      transformResponse: aMarca,
      invalidatesTags: ['Usuario', 'Marca'],
    }),

    /** La marca del usuario: datos, duenos y estadisticas. */
    miMarca: build.query<Marca, void>({
      query: () => ({ url: '/marcas/mia' }),
      transformResponse: aMarca,
      providesTags: ['Marca'],
    }),

    /**
     * Reemplaza los textos: se manda el formulario como quedo. Direccion o
     * telefono vacios se borran; el logo no se toca. Los colores, en cambio,
     * solo cambian si vienen (`null` los saca).
     */
    editarMarca: build.mutation<Marca, DatosMarca>({
      query: (datos) => ({ url: '/marcas/mia', method: 'PUT', body: datos }),
      transformResponse: aMarca,
      async onQueryStarted(_datos, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(marcasApi.util.upsertQueryData('miMarca', undefined, data));
      },
    }),

    /**
     * Logo, paso 1: la firma para subir el archivo directo a Cloudinary. Vale
     * una hora y solo sirve para pisar el logo de ESTA marca. El paso 2 (la
     * subida) no pasa por el backend: vive en `services/imagenes`.
     */
    firmarLogo: build.mutation<FirmaLogo, void>({
      query: () => ({ url: '/marcas/mia/logo/firma', method: 'POST' }),
      transformResponse: (respuesta: unknown) => firmaLogoSchema.parse(respuesta),
    }),

    /**
     * Logo, paso 3: solo la `version` que devolvio Cloudinary. El backend arma
     * la URL el mismo y chequea que el archivo exista antes de guardarlo.
     */
    guardarLogo: build.mutation<Marca, number>({
      query: (version) => ({ url: '/marcas/mia/logo', method: 'PUT', body: { version } }),
      transformResponse: aMarca,
      async onQueryStarted(_version, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(marcasApi.util.upsertQueryData('miMarca', undefined, data));
      },
    }),

    /**
     * Lo saca de la marca y lo borra de Cloudinary. Se vuelve a pedir la marca
     * en vez de leer la respuesta: la doc no fija su forma.
     */
    sacarLogo: build.mutation<void, void>({
      query: () => ({ url: '/marcas/mia/logo', method: 'DELETE' }),
      invalidatesTags: ['Marca'],
    }),

    /** Suma a alguien al instante, por su DNI. */
    sumarDueno: build.mutation<Marca, string>({
      query: (dni) => ({ url: '/marcas/mia/duenos', method: 'POST', body: { dni } }),
      transformResponse: aMarca,
      async onQueryStarted(_dni, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(marcasApi.util.upsertQueryData('miMarca', undefined, data));
      },
    }),

    /** Saca a OTRO dueno. Para irse uno mismo esta `irmeDeMarca`. */
    sacarDueno: build.mutation<Marca, string>({
      query: (usuarioId) => ({
        url: `/marcas/mia/duenos/${encodeURIComponent(usuarioId)}`,
        method: 'DELETE',
      }),
      transformResponse: aMarca,
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(marcasApi.util.upsertQueryData('miMarca', undefined, data));
      },
    }),

    /**
     * Irse: es el mismo DELETE con el id propio, pero responde otra cosa (la
     * marca en null y `pendiente: 'marca'`), por eso va aparte.
     */
    irmeDeMarca: build.mutation<RespuestaIrme, string>({
      query: (miId) => ({
        url: `/marcas/mia/duenos/${encodeURIComponent(miId)}`,
        method: 'DELETE',
      }),
      transformResponse: (respuesta: unknown) => respuestaIrmeSchema.parse(respuesta),
    }),
  }),
});

export const {
  useCompletarPerfilMutation,
  useCrearMarcaMutation,
  useMiMarcaQuery,
  useEditarMarcaMutation,
  useFirmarLogoMutation,
  useGuardarLogoMutation,
  useSacarLogoMutation,
  useSumarDuenoMutation,
  useSacarDuenoMutation,
  useIrmeDeMarcaMutation,
} = marcasApi;
