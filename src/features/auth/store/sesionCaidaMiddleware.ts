import { isRejectedWithValue, type Middleware } from '@reduxjs/toolkit';

import { SecureStorageKeys, secureStorageService } from '@/services/storage';

import { ENDPOINTS_PUBLICOS } from '../api/authApi';
import { pendienteSchema } from '../schemas';
import type { Pendiente } from '../types';
import { pendienteActualizado, sesionCerrada } from './authSlice';

const publicos = new Set<string>(ENDPOINTS_PUBLICOS);

/** El `detalles.pendiente` de un 403 del negocio, o null si no vino. */
function pendienteDelError(payload: unknown): Pendiente {
  const data = (payload as { data?: { detalles?: { pendiente?: unknown } } } | undefined)?.data;
  const leido = pendienteSchema.safeParse(data?.detalles?.pendiente ?? null);
  return leido.success ? leido.data : null;
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
 */
export const sesionCaidaMiddleware: Middleware = (store) => (next) => (accion) => {
  if (isRejectedWithValue(accion)) {
    const { status } = (accion.payload ?? {}) as { status?: unknown };
    const endpoint = (accion.meta as { arg?: { endpointName?: string } })?.arg?.endpointName;

    if (status === 401 && endpoint !== undefined && !publicos.has(endpoint)) {
      // El storage se limpia aca y no en un reducer: los reducers son puros.
      secureStorageService.remove(SecureStorageKeys.AUTH_TOKEN);
      store.dispatch(sesionCerrada());
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

  return next(accion);
};
