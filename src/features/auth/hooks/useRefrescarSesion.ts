import { useCallback } from 'react';

import { useAppDispatch } from '@/store';

import { useLazyUsuarioActualQuery } from '../api/authApi';
import { sesionRestaurada } from '../store/authSlice';

/**
 * Vuelve a pedir `/auth/me` y deja el usuario al dia en el store.
 *
 * Lo usan las pantallas que muestran datos de la cuenta: si le cambiaron el
 * nombre o el rol desde el panel, tirar para abajo lo trae sin cerrar sesion.
 *
 * Un error NO cierra la sesion a proposito: quedarse sin señal a mitad de un
 * refresh y aparecer en la pantalla de login seria mucho peor que no refrescar.
 * El 401 de verdad ya lo maneja `sesionCaidaMiddleware`.
 */
export function useRefrescarSesion() {
  const dispatch = useAppDispatch();
  const [pedirUsuario] = useLazyUsuarioActualQuery();

  return useCallback(async () => {
    try {
      const actual = await pedirUsuario().unwrap();
      dispatch(sesionRestaurada(actual));
    } catch {
      // Silencio a proposito: ver el comentario de arriba.
    }
  }, [dispatch, pedirUsuario]);
}
