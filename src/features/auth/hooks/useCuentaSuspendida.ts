import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/store';

import { RUTA_LOGIN } from '../rutas';
import { selectSuspension, suspensionVista } from '../store/authSlice';

/**
 * Lo que muestra la pantalla "Cuenta suspendida": el mensaje del backend y el
 * motivo, si el super_admin escribió uno.
 *
 * No reintenta nada a propósito: el backend va a seguir respondiendo 403 hasta
 * que el super_admin reactive la cuenta (docs/SUPER_ADMIN.md, 9.2).
 */
export function useCuentaSuspendida() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const suspension = useAppSelector(selectSuspension);

  const volverAlLogin = useCallback(() => {
    // Se borra antes de salir: si no, los portones mandarían de vuelta acá.
    dispatch(suspensionVista());
    router.replace(RUTA_LOGIN);
  }, [dispatch, router]);

  return { suspension, volverAlLogin };
}
