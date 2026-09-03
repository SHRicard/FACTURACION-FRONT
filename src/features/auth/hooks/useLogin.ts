import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';

import { SecureStorageKeys, secureStorageService } from '@/services/storage';
import { mensajeDeError } from '@/shared/utils';
import { useAppDispatch } from '@/store';

import { useLoginMutation } from '../api/authApi';
import { loginSchema } from '../schemas';
import { sesionIniciada } from '../store/authSlice';
import type { LoginForm } from '../types';

/**
 * Logica de la pantalla de login. La screen solo consume esto: no sabe que
 * existe RTK Query, ni el storage, ni el router.
 */
export function useLogin() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [login, { isLoading, error }] = useLoginMutation();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur', // valida al salir del campo, no en cada tecla
  });

  const enviar = form.handleSubmit(async (datos) => {
    try {
      const sesion = await login(datos).unwrap();
      // El token va al storage ENCRIPTADO, aparte del general.
      secureStorageService.setString(SecureStorageKeys.AUTH_TOKEN, sesion.token);
      dispatch(sesionIniciada(sesion));
      router.replace('/');
    } catch {
      // El detalle ya queda en `error` de la mutation; lo traduce mensajeDeError.
    }
  });

  return {
    form,
    enviar,
    cargando: isLoading,
    error: mensajeDeError(error),
  };
}
