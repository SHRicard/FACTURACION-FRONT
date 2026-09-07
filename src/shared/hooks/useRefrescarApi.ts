import { useCallback } from 'react';

import { baseApi, TAGS_API } from '@/services/api';
import { useAppDispatch } from '@/store';

/**
 * Refresca TODO lo que la app tenga cacheado de la API.
 *
 * Invalida todos los tags: RTK Query vuelve a pedir solo las queries que estan
 * montadas en ese momento, asi que tirar para abajo en Facturas no dispara las
 * requests de Clientes. Es el "actualizar la app" generico — cada feature que
 * tenga su propia query puede usar su `refetch` en lugar de este.
 *
 * Devuelve una promesa que resuelve cuando terminaron las requests que la
 * invalidacion disparo. Sin esa espera, la rueda del refresh desaparece antes
 * de que lleguen los datos y parece que no paso nada.
 */
export function useRefrescarApi() {
  const dispatch = useAppDispatch();

  return useCallback(async () => {
    dispatch(baseApi.util.invalidateTags([...TAGS_API]));
    // `allSettled` y no `all`: si una request falla, las otras igual terminan y
    // el gesto se corta. El error lo muestra la pantalla que lo pidio.
    await Promise.allSettled(dispatch(baseApi.util.getRunningQueriesThunk()));
  }, [dispatch]);
}
