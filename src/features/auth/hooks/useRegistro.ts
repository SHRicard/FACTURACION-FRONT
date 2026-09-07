import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';

import { aplicarDetalles, interpretarError } from '@/shared/utils';

import { useRegistroMutation } from '../api/authApi';
import { registroSchema } from '../schemas';
import type { RegistroForm } from '../types';
import { useAbrirSesion } from './useAbrirSesion';

/** Logica de la pantalla de registro. Al crear la cuenta, deja la sesion abierta. */
export function useRegistro() {
  const router = useRouter();
  const abrirSesion = useAbrirSesion();
  const [registro, { isLoading, error }] = useRegistroMutation();

  const form = useForm<RegistroForm>({
    resolver: zodResolver(registroSchema),
    defaultValues: { nombre: '', email: '', password: '', confirmarPassword: '' },
    mode: 'onBlur',
  });

  const detalle = interpretarError(error);

  const enviar = form.handleSubmit(async (datos) => {
    try {
      // El backend devuelve 201 con la sesion ya abierta: no se pasa por login.
      const sesion = await registro(datos).unwrap();
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
