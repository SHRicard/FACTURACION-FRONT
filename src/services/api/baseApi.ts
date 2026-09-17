import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { API_BASE_URL } from '@/config';
import { SecureStorageKeys, secureStorageService } from '@/services/storage';

/**
 * El `Authorization` de la sesion. Lo usa RTK Query y tambien lo que no pasa
 * por RTK Query (bajar el PDF de una factura a un archivo): un solo lugar sabe
 * de donde sale el token.
 */
export function headersDeSesion(): Record<string, string> {
  const token = secureStorageService.getString(SecureStorageKeys.AUTH_TOKEN);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const fetchConToken = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    for (const [clave, valor] of Object.entries(headersDeSesion())) headers.set(clave, valor);
    return headers;
  },
});

/**
 * Envuelve el fetch para rescatar el header `Retry-After` de los 429.
 *
 * RTK Query descarta los headers de la respuesta cuando hay error: el hook solo
 * recibe `{ status, data }`. Sin esto, un 429 se muestra como "demasiados
 * intentos" sin poder decir cuanto hay que esperar, y la persona reintenta a
 * ciegas. Lo metemos dentro de `data` porque es lo unico que sobrevive hasta la
 * pantalla; `interpretarError` lo lee de ahi.
 */
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  opciones,
) => {
  const resultado = await fetchConToken(args, api, opciones);

  if (resultado.error && resultado.error.status === 429) {
    const segundos = Number(resultado.meta?.response?.headers.get('Retry-After'));
    if (Number.isFinite(segundos)) {
      const cuerpo = resultado.error.data;
      resultado.error = {
        ...resultado.error,
        data: {
          ...(cuerpo && typeof cuerpo === 'object' ? cuerpo : {}),
          reintentarEn: segundos,
        },
      };
    }
  }

  return resultado;
};

/**
 * Todos los tipos de tag de la app.
 *
 * Va en una constante aparte porque no lo usa solo `createApi`: tambien
 * `useRefrescarApi`, que invalida esta lista entera cuando alguien tira para
 * abajo. Con un solo lugar, el dia que una feature suma un tag el gesto de
 * refrescar lo alcanza sin que haya que acordarse de tocar dos archivos.
 *
 * ⚠️ Al agregar un endpoint nuevo con su tag, sumalo ACA.
 */
export const TAGS_API = [
  'Usuario',
  'Legal',
  'Cliente',
  'Especie',
  'Ticket',
  'Factura',
  'Marca',
  'Metrica',
] as const;

/**
 * Base de RTK Query para toda la app. Las features NO crean su propia `createApi`:
 * inyectan sus endpoints aca con `baseApi.injectEndpoints({...})` desde
 * `features/<feature>/api/<feature>Api.ts`.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: TAGS_API,
  endpoints: () => ({}),
});
