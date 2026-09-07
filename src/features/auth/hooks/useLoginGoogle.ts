import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { GOOGLE_HABILITADO } from '@/config';
import { GoogleCancelado, obtenerIdTokenGoogle } from '@/services/auth';
import { interpretarError } from '@/shared/utils';

import { useLoginGoogleMutation } from '../api/authApi';
import { useAbrirSesion } from './useAbrirSesion';

/**
 * Logica del boton "Continuar con Google".
 *
 * Son dos pasos que pueden fallar por separado: abrir la hoja nativa de Google
 * (device sin Play Services, sin red, la persona cancela) y despues canjear el
 * ID token contra nuestro backend. El primero no lo cubre RTK Query, por eso el
 * error se maneja aca a mano en vez de leerlo de la mutation.
 */
export function useLoginGoogle() {
  const router = useRouter();
  const abrirSesion = useAbrirSesion();
  const [loginGoogle, { isLoading }] = useLoginGoogleMutation();

  const [error, setError] = useState<string | null>(null);
  const [abriendoHoja, setAbriendoHoja] = useState(false);

  const entrar = useCallback(async () => {
    setError(null);
    setAbriendoHoja(true);

    try {
      const idToken = await obtenerIdTokenGoogle();
      const sesion = await loginGoogle(idToken).unwrap();
      abrirSesion(sesion);
      router.replace('/');
      // `sesion.caso` distingue una cuenta recien creada ('creada') de una que
      // ya existia. Hoy las tres van a la home; cuando haya onboarding, ese es
      // el dato para desviar solo a las nuevas.
    } catch (fallo) {
      // Cerro la hoja de Google a proposito: no es un error que haya que
      // mostrar, y un cartel rojo despues de cancelar es puro ruido.
      if (fallo instanceof GoogleCancelado) return;

      const delBackend = interpretarError(fallo);
      // Un 503 significa que el backend no tiene los client ID cargados. Es un
      // problema de configuracion, no algo que la persona pueda resolver.
      setError(
        delBackend?.status === 503
          ? 'El acceso con Google no esta disponible en este momento.'
          : (delBackend?.mensaje ?? 'No pudimos entrar con Google. Proba de nuevo.'),
      );
    } finally {
      setAbriendoHoja(false);
    }
  }, [loginGoogle, abrirSesion, router]);

  return {
    entrar,
    cargando: abriendoHoja || isLoading,
    error,
    /** Sin client ID configurado no se muestra el boton. */
    disponible: GOOGLE_HABILITADO,
  };
}
