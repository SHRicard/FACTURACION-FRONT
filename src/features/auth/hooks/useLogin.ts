import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';

import { GOOGLE_HABILITADO } from '@/config';
import { aplicarDetalles, interpretarError } from '@/shared/utils';

import { useLoginMutation } from '../api/authApi';
import { RUTA_CUENTA_SUSPENDIDA } from '../rutas';
import { CODIGO_CUENTA_SUSPENDIDA, loginSchema } from '../schemas';
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
      const detalleFallo = interpretarError(fallo);
      // Suspendida: el cartel con el motivo lo muestra su propia pantalla.
      if (detalleFallo?.codigo === CODIGO_CUENTA_SUSPENDIDA) {
        router.replace(RUTA_CUENTA_SUSPENDIDA);
        return;
      }
      aplicarDetalles(form, detalleFallo);
    }
  });

  return {
    form,
    enviar,
    cargando: isLoading,
    error: detalle?.mensaje ?? null,
    /**
     * Debajo del error, "¿Te registraste con Google?". El back ya no dice qué
     * emails usan Google (K14): responde el mismo 401 para todo, así que la
     * pista va siempre ante un 401.
     */
    pistaGoogle: detalle?.status === 401 && GOOGLE_HABILITADO,
  };
}
