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
  DatosGoogle,
  LoginForm,
  RecuperarPasswordForm,
  RegistroForm,
  RespuestaSimple,
  Sesion,
  SesionGoogle,
  TokenResetValido,
  UsuarioActual,
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
    /*
     * Las mutations que ABREN sesión (login, registro, Google, reseteo y cambio
     * de contraseña) no invalidan 'Usuario' a propósito. RTK hace el refetch de
     * `/auth/me` dentro del mismo dispatch del fulfilled, y `prepareHeaders`
     * lee el storage antes de que `useAbrirSesion` guarde el token nuevo: el
     * pedido salía sin token o con el viejo, volvía 401 y el middleware cerraba
     * la sesión recién abierta en cada intento (C1). La sesión nueva ya viene
     * en la respuesta y va directo al slice con `sesionIniciada`.
     */
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
        // `aceptoTerminosYCondiciones` SI: sin el, el backend responde 400.
        const { confirmarPassword: _descartado, ...cuerpo } = registroSchema.parse(datos);
        return { url: '/auth/registro', method: 'POST', body: cuerpo };
      },
      transformResponse: (respuesta: unknown) => sesionSchema.parse(respuesta),
    }),

    /**
     * Login con Google. Del lado de la identidad el front manda UNICAMENTE el
     * ID token: el email y el nombre los saca el backend del token ya
     * verificado contra las claves publicas de Google. Mandar el email por
     * separado seria confiar en algo que cualquiera puede escribir.
     *
     * `aceptoTerminosYCondiciones` viaja SOLO si la persona tildo la casilla, y
     * por eso es opcional: este endpoint tambien crea cuentas, asi que sin
     * consentimiento el backend responde 400 y el hook abre la casilla en un
     * dialogo. Mandar `true` siempre seria aceptar por ella.
     *
     * Devuelve la misma sesion que el login normal mas `caso`, que dice si la
     * cuenta se creo, ya existia, o se vinculo con una que tenia contrasena.
     */
    loginGoogle: build.mutation<SesionGoogle, DatosGoogle>({
      query: ({ idToken, aceptoTerminosYCondiciones }) => ({
        url: '/auth/google',
        method: 'POST',
        body:
          aceptoTerminosYCondiciones === undefined
            ? { idToken }
            : { idToken, aceptoTerminosYCondiciones },
      }),
      transformResponse: (respuesta: unknown) => sesionGoogleSchema.parse(respuesta),
    }),

    /**
     * Rehidrata la sesion al abrir la app: dice si el token guardado sigue
     * valiendo y trae el usuario al dia, con lo que le falta (`pendiente`). Es
     * una query (no mutation) para que RTK Query la cachee y no la repita en
     * cada pantalla que la pida.
     */
    usuarioActual: build.query<UsuarioActual, void>({
      query: () => ({ url: '/auth/me' }),
      transformResponse: (respuesta: unknown) => usuarioActualSchema.parse(respuesta),
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
