import { usuarioActualSchema } from '@/features/auth/schemas';
import type { UsuarioActual } from '@/features/auth/types';
import { baseApi } from '@/services/api';

import { bajaCuentaSchema, documentoLegalSchema } from '../schemas';
import type { BajaCuenta, DocumentoLegal, TipoDocumento } from '../types';

/**
 * Los documentos legales y la aceptacion de los terminos.
 *
 * Los `GET /legal/*` son publicos (no piden token) y se los pedimos en JSON.
 * `POST /auth/me/terminos` si necesita la sesion: es el que deja registrado
 * QUE version acepto esta cuenta y cuando.
 */
export const legalApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Terminos y privacidad: los dos documentos que vienen en secciones. */
    documentoLegal: build.query<DocumentoLegal, TipoDocumento>({
      query: (tipo) => ({ url: `/legal/${tipo}`, params: { formato: 'json' } }),
      transformResponse: (respuesta: unknown) => documentoLegalSchema.parse(respuesta),
      providesTags: ['Legal'],
    }),

    /**
     * Los pasos de la baja. Va aparte de `documentoLegal` porque el backend lo
     * publica con OTRA forma: una lista de que se elimina, no secciones.
     */
    bajaCuenta: build.query<BajaCuenta, void>({
      query: () => ({ url: '/legal/eliminar-cuenta', params: { formato: 'json' } }),
      transformResponse: (respuesta: unknown) => bajaCuentaSchema.parse(respuesta),
      providesTags: ['Legal'],
    }),

    /**
     * Aceptar. No lleva cuerpo variable a proposito: el unico valor que el
     * backend acepta es `true` (un `false` responde 400, no existe "aceptar que
     * no acepto"), asi que no hay nada que elegir desde la pantalla.
     *
     * Responde la misma forma que `/auth/me`: el usuario al dia y el `pendiente`
     * que sigue ('perfil', 'marca' o null).
     */
    aceptarTerminos: build.mutation<UsuarioActual, void>({
      query: () => ({
        url: '/auth/me/terminos',
        method: 'POST',
        body: { aceptoTerminosYCondiciones: true },
      }),
      transformResponse: (respuesta: unknown) => usuarioActualSchema.parse(respuesta),
      invalidatesTags: ['Usuario'],
    }),
  }),
});

export const { useDocumentoLegalQuery, useBajaCuentaQuery, useAceptarTerminosMutation } = legalApi;
