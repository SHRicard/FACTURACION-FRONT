import { isRejectedWithValue, type Middleware } from '@reduxjs/toolkit';
import type { FetchBaseQueryMeta } from '@reduxjs/toolkit/query';

import { headersDeSesion } from '@/services/api';

import { ENDPOINTS_PUBLICOS } from '../api/authApi';
import { pendienteSchema } from '../schemas';
import type { Pendiente } from '../types';
import { pendienteActualizado } from './authSlice';
import { cerrarSesionLocal } from './cerrarSesionLocal';

const publicos = new Set<string>(ENDPOINTS_PUBLICOS);

/** El `detalles.pendiente` de un 403 del negocio, o null si no vino. */
function pendienteDelError(payload: unknown): Pendiente {
  const data = (payload as { data?: { detalles?: { pendiente?: unknown } } } | undefined)?.data;
  const leido = pendienteSchema.safeParse(data?.detalles?.pendiente ?? null);
  return leido.success ? leido.data : null;
}

/**
 * Con qué `Authorization` salió el pedido que falló. fetchBaseQuery guarda el
 * Request clonado en `meta.request`, y RTK Query lo deja en
 * `meta.baseQueryMeta` de todo rejected (rtk-query.modern.mjs:1072).
 *
 *   undefined → no se sabe (no llegó el request)
 *   null      → salió sin token
 *   string    → el header con el que salió
 */
function authorizationDelPedido(meta: unknown): string | null | undefined {
  const request = (meta as { baseQueryMeta?: FetchBaseQueryMeta } | undefined)?.baseQueryMeta
    ?.request;
  if (!request) return undefined;
  return request.headers.get('Authorization');
}

/**
 * Cierra la sesion cuando el backend deja de aceptar el token.
 *
 * El token dura 7 dias, pero ademas se invalida antes si la persona cambio su
 * contrasena (desde otro dispositivo, o por un reseteo). Sin esto, la app queda
 * mostrando pantallas vacias y errores sueltos con una sesion que ya no existe.
 *
 * Un 401 significa dos cosas segun de donde venga:
 *   - login / registro / reseteo → las credenciales o el link estan mal
 *   - cualquier otro endpoint    → la sesion vencio o se revoco
 * Solo el segundo caso justifica desloguear, por eso se filtran los publicos.
 * De lo contrario un tipeo en la contrasena del login dispararia un logout.
 *
 * Regla del contrato con el backend (K7): un 401 significa SOLO "el token de
 * sesión no sirve". Una credencial mal tipeada en un formulario con la sesión
 * abierta (la contraseña actual, la reautenticación de la baja) vuelve 400 con
 * `codigo: 'CREDENCIALES_INVALIDAS'` y no cierra nada. Por eso
 * `ENDPOINTS_PUBLICOS` lista únicamente lo que se llama sin sesión.
 */
export const sesionCaidaMiddleware: Middleware = (store) => (next) => (accion) => {
  // Primero el reducer: así el reset de la caché también se lleva la entrada
  // rechazada, en vez de que quede escrita después.
  const resultado = next(accion);

  if (isRejectedWithValue(accion)) {
    const { status } = (accion.payload ?? {}) as { status?: unknown };
    const endpoint = (accion.meta as { arg?: { endpointName?: string } })?.arg?.endpointName;

    if (status === 401 && endpoint !== undefined && !publicos.has(endpoint)) {
      /*
       * Un 401 de un pedido que salió sin token, o con uno anterior, no habla
       * de la sesión vigente. Cerrar por él borraba el token recién guardado:
       * eso era C1, el `/auth/me` que RTK re-pedía antes de que
       * `useAbrirSesion` guardara el nuevo. Pasaría lo mismo con un pedido
       * viejo que vuelve después de cambiar la contraseña.
       *
       * Si no se sabe con qué token salió, se cierra igual, como siempre.
       */
      const usado = authorizationDelPedido(accion.meta);
      const vigente = headersDeSesion().Authorization ?? null;
      if (usado === undefined || (usado !== null && usado === vigente)) {
        cerrarSesionLocal(store.dispatch);
      }
    }

    /*
     * Un 403 con `detalles.pendiente`: la sesion sirve, pero le falta algo
     * antes de operar. Pasa a mitad de uso: cambio la version de los terminos,
     * u otro dueno lo saco de la marca. Se atrapa en UN lugar, no en cada
     * pantalla: al cambiar el pendiente, el porton del area de administrador lo
     * manda a la pantalla del paso que falta.
     */
    if (status === 403) {
      const pendiente = pendienteDelError(accion.payload);
      if (pendiente) store.dispatch(pendienteActualizado(pendiente));
    }
  }

  return resultado;
};
