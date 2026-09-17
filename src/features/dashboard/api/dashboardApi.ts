import { baseApi } from '@/services/api';

import { resumenDashboardSchema } from '../schemas';
import type { ResumenDashboard } from '../types';

/**
 * El resumen del Inicio, en una sola llamada.
 *
 * Los parametros del endpoint (`dias`, `venceEnDias`, `diasInactivo`, `meses`
 * y `limite`) no viajan: los valores por defecto del backend son los que
 * queremos (ver `docs/dashboard_metricas.md` §4).
 *
 * Lleva el tag de las metricas, asi el "refrescar todo" de la app lo alcanza.
 */
export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    resumenDashboard: build.query<ResumenDashboard, void>({
      query: () => ({ url: '/metricas/resumen' }),
      transformResponse: (respuesta: unknown) => resumenDashboardSchema.parse(respuesta),
      providesTags: [{ type: 'Metrica', id: 'TODAS' }],
    }),
  }),
});

export const { useResumenDashboardQuery } = dashboardApi;
