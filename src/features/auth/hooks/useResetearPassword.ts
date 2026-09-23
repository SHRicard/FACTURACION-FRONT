import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';

import { aplicarDetalles, interpretarError } from '@/shared/utils';

import { useResetearPasswordMutation, useValidarTokenResetQuery } from '../api/authApi';
import { resetearPasswordSchema } from '../schemas';
import type { ResetearPasswordForm } from '../types';
import { useAbrirSesion } from './useAbrirSesion';

/**
 * Pantalla a la que se llega desde el link del mail (`/resetear-password?token=`).
 *
 * Son dos pasos contra el backend: primero se valida el token para no hacerle
 * escribir una contrasena nueva a alguien cuyo link ya vencio, y recien despues
 * se manda la nueva. El token dura 60 minutos y es de UN SOLO USO: si la persona
 * recarga la pantalla despues de resetear, la validacion falla y esta bien que
 * asi sea.
 */
export function useResetearPassword(token: string | null) {
  const router = useRouter();
  const abrirSesion = useAbrirSesion();

  const validacion = useValidarTokenResetQuery(token ?? '', { skip: !token });
  const [resetear, { isLoading, error }] = useResetearPasswordMutation();

  const form = useForm<ResetearPasswordForm>({
    resolver: zodResolver(resetearPasswordSchema),
    defaultValues: { password: '', confirmarPassword: '' },
    mode: 'onBlur',
  });

  const enviar = form.handleSubmit(async (datos) => {
    if (!token) return;
    try {
      // Devuelve la sesion ya iniciada: no se pasa por login de nuevo.
      const sesion = await resetear({ token, password: datos.password }).unwrap();
      abrirSesion(sesion);
      router.replace('/');
    } catch (fallo) {
      aplicarDetalles(form, interpretarError(fallo));
    }
  });

  return {
    form,
    enviar,
    cargando: isLoading,
    error: interpretarError(error)?.mensaje ?? null,

    /** Sin token en la URL no hay nada que validar: el link llego mal. */
    validando: Boolean(token) && validacion.isLoading,
    tokenValido: Boolean(token) && validacion.isSuccess,
    /** Para poder mostrar "Nueva contrasena para ana@tienda.com". */
    emailDeLaCuenta: validacion.data?.email ?? null,
    errorDelToken: token
      ? (interpretarError(validacion.error)?.mensaje ?? null)
      : 'El link no es valido o esta incompleto.',
  };
}
