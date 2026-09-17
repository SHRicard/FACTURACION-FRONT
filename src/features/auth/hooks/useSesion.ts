import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { baseApi } from '@/services/api';
import { cerrarSesionGoogle } from '@/services/auth';
import { SecureStorageKeys, secureStorageService } from '@/services/storage';
import { useAppDispatch, useAppSelector } from '@/store';

import {
  selectEstaAutenticado,
  selectPendiente,
  selectSesionVerificada,
  selectUsuario,
  sesionCerrada,
} from '../store/authSlice';

/** Lee la sesion activa y permite cerrarla. */
export function useSesion() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const usuario = useAppSelector(selectUsuario);
  /** Que le falta para usar la app: el DNI, la marca, o nada (null). */
  const pendiente = useAppSelector(selectPendiente);
  const estaAutenticado = useAppSelector(selectEstaAutenticado);
  const verificada = useAppSelector(selectSesionVerificada);

  const cerrarSesion = useCallback(() => {
    // Cerrar la sesion del backend no cierra la de Google. Sin esto, el proximo
    // "Continuar con Google" vuelve a entrar solo con la misma cuenta y no hay
    // forma de cambiar de usuario desde la app. No se espera: que la pantalla
    // de login tarde en aparecer por esto seria peor que la sesion de Google.
    void cerrarSesionGoogle();

    secureStorageService.remove(SecureStorageKeys.AUTH_TOKEN);
    dispatch(sesionCerrada());
    // Sin esto, el `/auth/me` de la sesion anterior queda cacheado y la proxima
    // persona que entre en este dispositivo arranca viendo los datos del que se
    // fue hasta que la request nueva responda.
    dispatch(baseApi.util.resetApiState());
    router.replace('/login');
  }, [dispatch, router]);

  return { usuario, pendiente, estaAutenticado, verificada, cerrarSesion };
}
