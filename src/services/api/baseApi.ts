import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { API_BASE_URL } from '@/config';
import { SecureStorageKeys, secureStorageService } from '@/services/storage';

/**
 * Base de RTK Query para toda la app. Las features NO crean su propia `createApi`:
 * inyectan sus endpoints aca con `baseApi.injectEndpoints({...})` desde
 * `features/<feature>/api/<feature>Api.ts`.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = secureStorageService.getString(SecureStorageKeys.AUTH_TOKEN);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  // Los tags los extiende cada feature con `addTagTypes` en su injectEndpoints.
  tagTypes: [],
  endpoints: () => ({}),
});
