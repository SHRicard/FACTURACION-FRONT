import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';

import { SecureStorageKeys, secureStorageService } from '@/services/storage';
import { mensajeDeError } from '@/shared/utils';
import { useAppDispatch } from '@/store';

import { useRegistroMutation } from '../api/authApi';
import { registroSchema } from '../schemas';
import { sesionIniciada } from '../store/authSlice';
import type { RegistroForm } from '../types';

/** Logica de la pantalla de registro. Al crear la cuenta, deja la sesion abierta. */
export function useRegistro() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [registro, { isLoading, error }] = useRegistroMutation();

  const form = useForm<RegistroForm>({
    resolver: zodResolver(registroSchema),
    defaultValues: { nombre: '', email: '', password: '', confirmarPassword: '' },
    mode: 'onBlur',
  });

  const enviar = form.handleSubmit(async (datos) => {
    try {
      const sesion = await registro(datos).unwrap();
      secureStorageService.setString(SecureStorageKeys.AUTH_TOKEN, sesion.token);
      dispatch(sesionIniciada(sesion));
      router.replace('/');
    } catch {
      // Lo muestra la pantalla via `error`.
    }
  });

  return {
    form,
    enviar,
    cargando: isLoading,
    error: mensajeDeError(error),
  };
}
