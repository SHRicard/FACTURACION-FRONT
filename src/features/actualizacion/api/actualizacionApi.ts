import { baseApi } from '@/services/api';

import { versionAppSchema } from '../schemas';
import type { VersionApp } from '../types';

/**
 * La versión mínima y la última de la app (K8), inyectadas sobre el `baseApi`.
 *
 * `/app/version` es público: se pide una vez al montar la raíz, sin bloquear
 * el arranque. No lleva tags: nada lo invalida, y el resultado lo absorbe el
 * slice de la feature por su matcher.
 */
export const actualizacionApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    versionApp: build.query<VersionApp, void>({
      query: () => ({ url: '/app/version' }),
      transformResponse: (respuesta: unknown) => versionAppSchema.parse(respuesta),
    }),
  }),
});

export const { useVersionAppQuery } = actualizacionApi;
