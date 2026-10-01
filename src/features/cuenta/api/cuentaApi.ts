import { baseApi } from '@/services/api';

import { cuentaEliminadaSchema, PALABRA_CONFIRMACION } from '../schemas';
import type { CuentaEliminada } from '../types';

/**
 * La baja de la cuenta desde adentro de la app.
 *
 * Google la exige para publicar en Play (junto con la pagina web de baja, que
 * sirve a quien perdio el acceso y vive en `/legal/eliminar-cuenta`).
 *
 * Despues de esto el token queda muerto: cualquier request responde 401, asi
 * que el hook limpia la sesion y vuelve al login.
 */
export const cuentaApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    eliminarCuenta: build.mutation<CuentaEliminada, void>({
      // La confirmacion no es un parametro: el unico valor que el backend
      // acepta es la palabra literal, y quien la escribe es la persona en el
      // dialogo. Lo que se elige alla es SI se manda, no que se manda.
      query: () => ({
        url: '/auth/me/cuenta',
        method: 'DELETE',
        body: { confirmacion: PALABRA_CONFIRMACION },
      }),
      transformResponse: (respuesta: unknown) => cuentaEliminadaSchema.parse(respuesta),
    }),
  }),
});

export const { useEliminarCuentaMutation } = cuentaApi;
