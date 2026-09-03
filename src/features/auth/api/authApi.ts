import { baseApi } from '@/services/api';

import {
  loginSchema,
  recuperarPasswordSchema,
  registroSchema,
  respuestaSimpleSchema,
  sesionSchema,
} from '../schemas';
import type {
  LoginForm,
  RecuperarPasswordForm,
  RegistroForm,
  RespuestaSimple,
  Sesion,
} from '../types';

/**
 * Endpoints de autenticacion, inyectados sobre el `baseApi`.
 *
 * Toda respuesta pasa por su schema de Zod: si el backend cambia un campo o
 * devuelve algo raro, falla aca con un error claro y no 12 pantallas mas
 * adelante con un `undefined is not an object`.
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<Sesion, LoginForm>({
      query: (credenciales) => ({
        url: '/auth/login',
        method: 'POST',
        body: loginSchema.parse(credenciales),
      }),
      transformResponse: (respuesta: unknown) => sesionSchema.parse(respuesta),
    }),

    registro: build.mutation<Sesion, RegistroForm>({
      query: (datos) => {
        // `confirmarPassword` es solo del formulario: no viaja al backend.
        const { confirmarPassword: _descartado, ...cuerpo } = registroSchema.parse(datos);
        return { url: '/auth/registro', method: 'POST', body: cuerpo };
      },
      transformResponse: (respuesta: unknown) => sesionSchema.parse(respuesta),
    }),

    recuperarPassword: build.mutation<RespuestaSimple, RecuperarPasswordForm>({
      query: (datos) => ({
        url: '/auth/recuperar-password',
        method: 'POST',
        body: recuperarPasswordSchema.parse(datos),
      }),
      transformResponse: (respuesta: unknown) => respuestaSimpleSchema.parse(respuesta),
    }),
  }),
});

export const { useLoginMutation, useRegistroMutation, useRecuperarPasswordMutation } = authApi;
