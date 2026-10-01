import { baseApi } from '@/services/api';

import { avisosAppSchema, dispositivoRegistradoSchema } from '../schemas';
import type { AvisosApp, DispositivoRegistrado } from '../types';

/**
 * Lo de las notificaciones que usa TODA la app, con o sin sesion. Los dos
 * endpoints son publicos: nunca responden 401.
 */
export const notificacionesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Le pasa al back el token de Expo de este telefono. El `Authorization`
     * lo pone el baseApi: con sesion queda asociado a la cuenta, sin sesion
     * queda anonimo. Los dos reciben los avisos.
     */
    registrarDispositivo: build.mutation<DispositivoRegistrado, { token: string }>({
      query: (body) => ({ url: '/app/dispositivos', method: 'POST', body }),
      transformResponse: (respuesta: unknown) => dispositivoRegistradoSchema.parse(respuesta),
    }),

    /** Los ultimos 20 avisos de los ultimos 90 dias, el mas nuevo primero. */
    avisosApp: build.query<AvisosApp, void>({
      query: () => ({ url: '/app/avisos' }),
      transformResponse: (respuesta: unknown) => avisosAppSchema.parse(respuesta),
      providesTags: ['Aviso'],
    }),
  }),
});

export const { useRegistrarDispositivoMutation, useAvisosAppQuery } = notificacionesApi;
