import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { Platform } from 'react-native';

import { API_BASE_URL, VERSION_APP } from '@/config';
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

/**
 * Quién pide: la versión de la app y la plataforma. El backend corta con 426
 * a las versiones por debajo de la mínima (K8); sin versión no se manda y el
 * back no bloquea. Acá `Platform` sí es de la plataforma: define la tienda a
 * la que hay que mandar a actualizar.
 */
export function headersDeApp(): Record<string, string> {
  return {
    'X-App-Plataforma': Platform.OS,
    ...(VERSION_APP ? { 'X-App-Version': VERSION_APP } : {}),
  };
}

const fetchConToken = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  // Sin tope, una request colgada con mala señal deja el botón girando para
  // siempre. Con tope, "no sé si se guardó" pasa a ser un TIMEOUT_ERROR: un
  // estado explícito y reintentable (con la misma clave de idempotencia, K1).
  // En Android el OkHttp de RN trae los timeouts en 0 (no corta nunca), así
  // que sin esto el arranque quedaba en la rueda durante minutos.
  // ⚠️ En nativo el corte llega como FETCH_ERROR y no como TIMEOUT_ERROR:
  // whatwg-fetch rechaza con AbortError sea cual sea el motivo
  // (whatwg-fetch/dist/fetch.umd.js l.537/579). Por eso se tratan igual.
  timeout: 20_000,
  prepareHeaders: (headers) => {
    for (const [clave, valor] of Object.entries({ ...headersDeApp(), ...headersDeSesion() })) {
      headers.set(clave, valor);
    }
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
  // Panel del super_admin (`/admin/*`).
  'Plataforma',
  'AdminUsuario',
  'AdminMarca',
  'ErrorApp',
  'AdminAviso',
  // Avisos que ve la app (`/app/avisos`), con o sin sesión.
  'Aviso',
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
