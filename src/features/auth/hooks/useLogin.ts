import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';

import { aplicarDetalles, interpretarError } from '@/shared/utils';

import { useLoginMutation } from '../api/authApi';
import { loginSchema } from '../schemas';
import type { LoginForm } from '../types';
import { useAbrirSesion } from './useAbrirSesion';

/**
 * Logica de la pantalla de login. La screen solo consume esto: no sabe que
 * existe RTK Query, ni el storage, ni el router.
 */
export function useLogin() {
  const router = useRouter();
  const abrirSesion = useAbrirSesion();
  const [login, { isLoading, error }] = useLoginMutation();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur', // valida al salir del campo, no en cada tecla
  });

  const detalle = interpretarError(error);

  const enviar = form.handleSubmit(async (datos) => {
    try {
      const sesion = await login(datos).unwrap();
      abrirSesion(sesion);
      router.replace('/');
    } catch (fallo) {
      aplicarDetalles(form, interpretarError(fallo)?.detalles ?? null);
    }
  });

  return {
    form,
    enviar,
    cargando: isLoading,
    error: detalle?.mensaje ?? null,
  };
}
