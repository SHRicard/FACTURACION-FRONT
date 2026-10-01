import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { cerrarSesionGoogle } from '@/services/auth';
import { useAppDispatch, useAppSelector } from '@/store';

import {
  selectEstaAutenticado,
  selectPendiente,
  selectSesionVerificada,
  selectSuspension,
  selectUsuario,
} from '../store/authSlice';
import { cerrarSesionLocal } from '../store/cerrarSesionLocal';

/** Lee la sesion activa y permite cerrarla. */
export function useSesion() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const usuario = useAppSelector(selectUsuario);
  /** Que le falta para usar la app: el DNI, la marca, o nada (null). */
  const pendiente = useAppSelector(selectPendiente);
  const estaAutenticado = useAppSelector(selectEstaAutenticado);
  const verificada = useAppSelector(selectSesionVerificada);
  /** La cuenta se suspendio: sin sesion, se manda a "Cuenta suspendida" y no a login. */
  const suspension = useAppSelector(selectSuspension);

  const cerrarSesion = useCallback(() => {
    // Cerrar la sesion del backend no cierra la de Google: sin esto queda en el
    // sandbox de la app el ID token de quien se fue. No se espera: que la
    // pantalla de login tarde en aparecer por esto seria peor.
    void cerrarSesionGoogle();

    // Token, usuario y caché de RTK Query. Sin vaciar la caché, el `/auth/me`
    // de la sesion anterior queda cacheado y la proxima persona que entre en
    // este dispositivo arranca viendo los datos del que se fue hasta que la
    // request nueva responda.
    cerrarSesionLocal(dispatch);
    router.replace('/login');
  }, [dispatch, router]);

  return { usuario, pendiente, estaAutenticado, verificada, suspension, cerrarSesion };
}
