import { useCallback } from 'react';

import { SecureStorageKeys, secureStorageService } from '@/services/storage';
import { useAppDispatch } from '@/store';

import { sesionIniciada } from '../store/authSlice';
import type { Sesion } from '../types';

/**
 * Guarda el token y deja la sesion abierta.
 *
 * Lo comparten login, registro, reseteo y cambio de contrasena: los cuatro
 * endpoints devuelven la misma forma `{ token, usuario }` y los cuatro tienen
 * que hacer exactamente esto con ella.
 */
export function useAbrirSesion() {
  const dispatch = useAppDispatch();

  return useCallback(
    (sesion: Sesion) => {
      // El token va al storage ENCRIPTADO, aparte del general.
      secureStorageService.setString(SecureStorageKeys.AUTH_TOKEN, sesion.token);
      dispatch(sesionIniciada(sesion));
    },
    [dispatch],
  );
}
