import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { aplicarDetalles, interpretarError } from '@/shared/utils';

import { useCambiarPasswordMutation } from '../api/authApi';
import { cambiarPasswordSchema } from '../schemas';
import type { CambiarPasswordForm } from '../types';
import { useAbrirSesion } from './useAbrirSesion';

/**
 * Cambio de contrasena con la sesion abierta (pantalla de perfil).
 *
 * El backend invalida los tokens viejos al cambiar la clave y devuelve uno
 * nuevo: hay que guardarlo si o si, porque el que tenemos en el storage deja de
 * servir en el mismo momento. Por eso pasa por `abrirSesion` igual que un login.
 */
export function useCambiarPassword() {
  const abrirSesion = useAbrirSesion();
  const [cambiar, { isLoading, error, isSuccess }] = useCambiarPasswordMutation();

  const form = useForm<CambiarPasswordForm>({
    resolver: zodResolver(cambiarPasswordSchema),
    defaultValues: { passwordActual: '', passwordNueva: '', confirmarPassword: '' },
    mode: 'onBlur',
  });

  const enviar = form.handleSubmit(async (datos) => {
    try {
      const sesion = await cambiar(datos).unwrap();
      abrirSesion(sesion);
      form.reset();
    } catch (fallo) {
      aplicarDetalles(form, interpretarError(fallo));
    }
  });

  return {
    form,
    enviar,
    cargando: isLoading,
    error: interpretarError(error)?.mensaje ?? null,
    cambiado: isSuccess,
  };
}
