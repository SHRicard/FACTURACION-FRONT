import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import {
  selectEstaAutenticado,
  selectUsuario,
  sesionCerrada,
} from '@/features/auth/store/authSlice';
import { SecureStorageKeys, secureStorageService } from '@/services/storage';
import { useAppDispatch, useAppSelector } from '@/store';

/** Lee la sesion activa y permite cerrarla. */
export function useSesion() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const usuario = useAppSelector(selectUsuario);
  const estaAutenticado = useAppSelector(selectEstaAutenticado);

  const cerrarSesion = useCallback(() => {
    secureStorageService.remove(SecureStorageKeys.AUTH_TOKEN);
    dispatch(sesionCerrada());
    router.replace('/login');
  }, [dispatch, router]);

  return { usuario, estaAutenticado, cerrarSesion };
}
