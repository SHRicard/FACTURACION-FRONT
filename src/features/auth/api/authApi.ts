import { baseApi } from '@/services/api';

import {
  cambiarPasswordSchema,
  loginSchema,
  recuperarPasswordSchema,
  registroSchema,
  respuestaSimpleSchema,
  sesionGoogleSchema,
  sesionSchema,
  tokenResetValidoSchema,
  usuarioActualSchema,
} from '../schemas';
import type {
  CambiarPasswordForm,
  LoginForm,
  RecuperarPasswordForm,
  RegistroForm,
  RespuestaSimple,
  Sesion,
  SesionGoogle,
  TokenResetValido,
  Usuario,
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
      invalidatesTags: ['Usuario'],
    }),

    registro: build.mutation<Sesion, RegistroForm>({
      query: (datos) => {
        // `confirmarPassword` es solo del formulario: no viaja al backend.
        const { confirmarPassword: _descartado, ...cuerpo } = registroSchema.parse(datos);
        return { url: '/auth/registro', method: 'POST', body: cuerpo };
      },
      transformResponse: (respuesta: unknown) => sesionSchema.parse(respuesta),
      invalidatesTags: ['Usuario'],
    }),

    /**
     * Login con Google. El front manda UNICAMENTE el ID token: el email y el
     * nombre los saca el backend del token ya verificado contra las claves
     * publicas de Google. Mandar el email por separado seria confiar en algo
     * que cualquiera puede escribir.
     *
     * Devuelve la misma sesion que el login normal mas `caso`, que dice si la
     * cuenta se creo, ya existia, o se vinculo con una que tenia contrasena.
     */
    loginGoogle: build.mutation<SesionGoogle, string>({
      query: (idToken) => ({
        url: '/auth/google',
        method: 'POST',
        body: { idToken },
      }),
      transformResponse: (respuesta: unknown) => sesionGoogleSchema.parse(respuesta),
      invalidatesTags: ['Usuario'],
    }),

    /**
     * Rehidrata la sesion al abrir la app: dice si el token guardado sigue
     * valiendo y trae el usuario al dia. Es una query (no mutation) para que
     * RTK Query la cachee y no la repita en cada pantalla que la pida.
     */
    usuarioActual: build.query<Usuario, void>({
      query: () => ({ url: '/auth/me' }),
      transformResponse: (respuesta: unknown) => usuarioActualSchema.parse(respuesta).usuario,
      providesTags: ['Usuario'],
    }),

    recuperarPassword: build.mutation<RespuestaSimple, RecuperarPasswordForm>({
      query: (datos) => ({
        url: '/auth/recuperar-password',
        method: 'POST',
        body: recuperarPasswordSchema.parse(datos),
      }),
      transformResponse: (respuesta: unknown) => respuestaSimpleSchema.parse(respuesta),
    }),

    /**
     * Valida el link del mail ANTES de mostrar el formulario, para no hacerle
     * escribir una contrasena nueva a alguien cuyo token ya vencio.
     */
    validarTokenReset: build.query<TokenResetValido, string>({
      query: (token) => ({ url: `/auth/recuperar-password/${encodeURIComponent(token)}` }),
      transformResponse: (respuesta: unknown) => tokenResetValidoSchema.parse(respuesta),
    }),

    /** Paso final del reseteo. Devuelve la sesion ya iniciada. */
    resetearPassword: build.mutation<Sesion, { token: string; password: string }>({
      query: ({ token, password }) => ({
        url: '/auth/resetear-password',
        method: 'POST',
        body: { token, password },
      }),
      transformResponse: (respuesta: unknown) => sesionSchema.parse(respuesta),
      invalidatesTags: ['Usuario'],
    }),

    /**
     * Cambio de contrasena con la sesion abierta. El backend invalida los JWT
     * viejos, asi que devuelve uno nuevo que hay que guardar (lo hace el hook).
     */
    cambiarPassword: build.mutation<Sesion, CambiarPasswordForm>({
      query: (datos) => {
        const { passwordActual, passwordNueva } = cambiarPasswordSchema.parse(datos);
        return {
          url: '/auth/cambiar-password',
          method: 'POST',
          body: { passwordActual, passwordNueva },
        };
      },
      transformResponse: (respuesta: unknown) => sesionSchema.parse(respuesta),
      invalidatesTags: ['Usuario'],
    }),
  }),
});

/**
 * Endpoints que se llaman SIN sesion. Un 401 de estos significa "credenciales
 * mal" o "link vencido", no "se te cayo la sesion": el middleware los usa para
 * no desloguear de mas.
 */
export const ENDPOINTS_PUBLICOS = [
  'login',
  'loginGoogle',
  'registro',
  'recuperarPassword',
  'validarTokenReset',
  'resetearPassword',
] as const;

export const {
  useLoginMutation,
  useLoginGoogleMutation,
  useRegistroMutation,
  useUsuarioActualQuery,
  useLazyUsuarioActualQuery,
  useRecuperarPasswordMutation,
  useValidarTokenResetQuery,
  useResetearPasswordMutation,
  useCambiarPasswordMutation,
} = authApi;
