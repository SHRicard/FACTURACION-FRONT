import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { mensajeDeError } from '@/shared/utils';

import { useRecuperarPasswordMutation } from '../api/authApi';
import { recuperarPasswordSchema } from '../schemas';
import type { RecuperarPasswordForm } from '../types';

/**
 * Logica de "recuperar contrasena". A diferencia de login/registro no navega a
 * ningun lado: se queda mostrando la confirmacion de que el mail salio.
 */
export function useRecuperarPassword() {
  const [recuperar, { isLoading, error, isSuccess, data }] = useRecuperarPasswordMutation();

  const form = useForm<RecuperarPasswordForm>({
    resolver: zodResolver(recuperarPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  });

  const enviar = form.handleSubmit(async (datos) => {
    try {
      await recuperar(datos).unwrap();
    } catch {
      // Lo muestra la pantalla via `error`.
    }
  });

  return {
    form,
    enviar,
    cargando: isLoading,
    error: mensajeDeError(error),
    enviado: isSuccess,
    mensaje: data?.mensaje ?? null,
  };
}
