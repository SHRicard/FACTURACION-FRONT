import { isRejectedWithValue, type Middleware } from '@reduxjs/toolkit';

import { cuerpoDesactualizadaSchema } from '../schemas';
import { appDesactualizada } from './actualizacionSlice';

/**
 * Bloquea la app cuando el backend responde 426 APP_DESACTUALIZADA (K8).
 *
 * El 426 puede venir de cualquier ruta, el login incluido: el back lo manda
 * cuando `X-App-Version` quedó por debajo de la mínima. Se atrapa en UN lugar,
 * con el mismo patrón que `sesionCaidaMiddleware`, y `PuertaActualizacion` (en
 * la raíz) tapa todo sin desmontar el navegador.
 *
 * El cuerpo es opcional: aunque no traiga la mínima ni el link, se bloquea
 * igual, y "Actualizar" usa la tienda por defecto.
 */
export const actualizacionMiddleware: Middleware = (store) => (next) => (accion) => {
  const resultado = next(accion);

  if (isRejectedWithValue(accion)) {
    const { status, data } = (accion.payload ?? {}) as { status?: unknown; data?: unknown };

    if (status === 426) {
      const leido = cuerpoDesactualizadaSchema.safeParse(data);
      const detalles = leido.success ? leido.data.detalles : undefined;
      store.dispatch(
        appDesactualizada({
          minima: detalles?.minima ?? null,
          urlTienda: detalles?.urlTienda ?? null,
        }),
      );
    }
  }

  return resultado;
};
