import { useCallback } from 'react';

import { sesionRestaurada } from '@/features/auth/store/authSlice';
import { baseApi } from '@/services/api';
import { interpretarError } from '@/shared/utils';
import { useAppDispatch } from '@/store';

import { useAceptarTerminosMutation } from '../api/legalApi';

/**
 * Aceptar los terminos con la sesion abierta.
 *
 * No navega, igual que los hooks de la bienvenida: deja el `pendiente` al dia y
 * la puerta de la pantalla redirige sola al paso que siga (el DNI, la marca, o
 * la app). Asi hay UN lugar que decide a donde se va.
 */
export function useAceptarTerminos() {
  const dispatch = useAppDispatch();
  const [aceptar, { isLoading, error }] = useAceptarTerminosMutation();

  const confirmar = useCallback(async () => {
    try {
      const actual = await aceptar().unwrap();
      dispatch(sesionRestaurada(actual));
      /*
       * Mientras los terminos estaban pendientes, TODA ruta del negocio
       * respondia 403 y esas respuestas quedaron en la cache. Sin tirarla, la
       * persona entra a una app llena de pantallas de error hasta que cada una
       * reintente por su cuenta.
       */
      dispatch(baseApi.util.resetApiState());
    } catch {
      // Queda en `error` y lo muestra la pantalla.
    }
  }, [aceptar, dispatch]);

  return {
    confirmar,
    aceptando: isLoading,
    error: interpretarError(error)?.mensaje ?? null,
  };
}
