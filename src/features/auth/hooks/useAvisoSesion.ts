import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/store';

import { avisoDeSesionVisto, selectAvisoSesion } from '../store/authSlice';
import type { AvisoSesion } from '../types';

/** El texto de cada aviso. El slice guarda solo la clave. */
const TEXTOS_AVISO: Record<AvisoSesion, { titulo: string; texto: string }> = {
  'google-vinculada': {
    titulo: 'Tu cuenta quedó vinculada a Google',
    texto:
      'Vinculamos Google a tu cuenta. Desde ahora entrás con Google; tu contraseña anterior ya no sirve.',
  },
};

/**
 * El aviso de una sola vez de la sesión recién abierta (ej. la cuenta quedó
 * vinculada a Google), listo para el diálogo. `cerrar` lo descarta para
 * siempre: no vuelve a aparecer.
 */
export function useAvisoSesion() {
  const dispatch = useAppDispatch();
  const clave = useAppSelector(selectAvisoSesion);

  const cerrar = useCallback(() => {
    dispatch(avisoDeSesionVisto());
  }, [dispatch]);

  return { aviso: clave ? TEXTOS_AVISO[clave] : null, cerrar };
}
