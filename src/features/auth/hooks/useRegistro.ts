import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';

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
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      confirmarPassword: '',
      // SIN tildar, siempre. Una casilla marcada de fabrica es motivo de
      // rechazo en la revision de Google Play, y ademas no seria consentimiento.
      aceptoTerminosYCondiciones: false,
    },
    mode: 'onBlur',
  });

  const detalle = interpretarError(error);

  // `useWatch` y no `form.watch`: el compilador de React no puede memoizar `watch`.
  const acepto = useWatch({ control: form.control, name: 'aceptoTerminosYCondiciones' });

  const cambiarAcepto = useCallback(
    (valor: boolean) =>
      form.setValue('aceptoTerminosYCondiciones', valor, {
        // Antes del primer envio no hay error que limpiar: validar en cada
        // toque solo haria parpadear un cartel rojo mientras se decide.
        shouldValidate: form.formState.isSubmitted,
      }),
    [form],
  );

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
    /** La casilla de los terminos: su valor, como cambiarlo y su error. */
    terminos: {
      acepto,
      cambiar: cambiarAcepto,
      error: form.formState.errors.aceptoTerminosYCondiciones?.message ?? null,
    },
  };
}
