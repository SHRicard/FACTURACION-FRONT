import { useCallback } from 'react';

import { baseApi } from '@/services/api';
import { SecureStorageKeys, secureStorageService } from '@/services/storage';
import { useAppDispatch, useAppSelector } from '@/store';

import { selectUsuario, sesionIniciada } from '../store/authSlice';
import type { Sesion } from '../types';

/**
 * Guarda el token y deja la sesion abierta.
 *
 * Lo comparten login, registro, reseteo y cambio de contrasena: los cuatro
 * endpoints devuelven la misma forma `{ token, usuario }` y los cuatro tienen
 * que hacer exactamente esto con ella.
 *
 * La caché de RTK Query se vacía SOLO si entra otra cuenta:
 *   - Cambio de cuenta sin pasar por un cierre (el link de reseteo o el login
 *     de otra cuenta abiertos con una sesión viva): se vacía la caché de la
 *     anterior, que si no se ve con los datos de otra marca.
 *   - Desde "sin sesión" no hace falta: todas las salidas ya la vaciaron con
 *     `cerrarSesionLocal`. Resetear acá, además, re-dispararía las queries
 *     montadas de la pantalla que abre la sesión: ResetearPassword volvería a
 *     validar un token de un solo uso y mostraría "Enlace no válido" durante
 *     la transición.
 *   - Con la misma cuenta (cambio de contraseña) tampoco: es la misma persona
 *     y se evita recargar todas las pestañas.
 */
export function useAbrirSesion() {
  const dispatch = useAppDispatch();
  const usuarioPrevio = useAppSelector(selectUsuario);

  return useCallback(
    (sesion: Sesion) => {
      if (usuarioPrevio !== null && usuarioPrevio.id !== sesion.usuario.id) {
        dispatch(baseApi.util.resetApiState());
      }
      // El token va al storage ENCRIPTADO, aparte del general.
      secureStorageService.setString(SecureStorageKeys.AUTH_TOKEN, sesion.token);
      dispatch(sesionIniciada(sesion));
    },
    [dispatch, usuarioPrevio],
  );
}
