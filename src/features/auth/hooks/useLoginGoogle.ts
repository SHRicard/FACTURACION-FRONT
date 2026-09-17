import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { GOOGLE_HABILITADO } from '@/config';
import { GoogleCancelado, obtenerIdTokenGoogle } from '@/services/auth';
import { interpretarError, type ErrorApi } from '@/shared/utils';

import { useLoginGoogleMutation } from '../api/authApi';
import { useAbrirSesion } from './useAbrirSesion';

/** El campo que nombra el backend en el 400 cuando falta el consentimiento. */
const CAMPO_TERMINOS = 'aceptoTerminosYCondiciones';

/**
 * El backend rechazo el alta porque nadie acepto los terminos todavia. Es la
 * senal de que esta cuenta de Google NO existe: si existiera, habria entrado.
 */
const faltaAceptar = (detalle: ErrorApi | null): boolean =>
  detalle?.status === 400 && detalle.detalles?.['campo'] === CAMPO_TERMINOS;

interface OpcionesLoginGoogle {
  /**
   * La casilla de los terminos de la pantalla, cuando la hay (el registro).
   * Sin ella —el login— el primer intento va sin consentimiento y, si el
   * backend lo pide, lo pregunta el dialogo.
   */
  acepto?: boolean;
}

/**
 * Logica del boton "Continuar con Google".
 *
 * Son dos pasos que pueden fallar por separado: abrir la hoja nativa de Google
 * (device sin Play Services, sin red, la persona cancela) y despues canjear el
 * ID token contra nuestro backend. El primero no lo cubre RTK Query, por eso el
 * error se maneja aca a mano en vez de leerlo de la mutation.
 *
 * El consentimiento: este endpoint tambien CREA cuentas, y Google exige que
 * nadie quede registrado sin haber tildado una casilla. Mandar `true` siempre
 * seria aceptar en nombre de la persona, asi que el campo viaja solo cuando
 * ella lo tildo. Si no lo tildo y el backend lo exige, se abre el dialogo con
 * la casilla y se reintenta el canje con el mismo ID token.
 */
export function useLoginGoogle({ acepto }: OpcionesLoginGoogle = {}) {
  const router = useRouter();
  const abrirSesion = useAbrirSesion();
  const [loginGoogle, { isLoading }] = useLoginGoogleMutation();

  const [error, setError] = useState<string | null>(null);
  const [abriendoHoja, setAbriendoHoja] = useState(false);
  /** El ID token del intento que quedo esperando el consentimiento. */
  const tokenPendiente = useRef<string | null>(null);
  const [pidiendoConsentimiento, setPidiendoConsentimiento] = useState(false);
  const [aceptaEnDialogo, setAceptaEnDialogo] = useState(false);
  /** Error del segundo intento. Va DENTRO del dialogo, que queda abierto. */
  const [errorConsentimiento, setErrorConsentimiento] = useState<string | null>(null);

  const canjear = useCallback(
    async (idToken: string, aceptoTerminosYCondiciones: boolean | undefined) => {
      const sesion = await loginGoogle({ idToken, aceptoTerminosYCondiciones }).unwrap();
      // Ya se uso: no tiene sentido que siga en memoria.
      tokenPendiente.current = null;
      abrirSesion(sesion);
      router.replace('/');
      // `sesion.caso` distingue una cuenta recien creada ('creada') de una que
      // ya existia. Las tres van a la raiz, que decide segun el `pendiente`.
    },
    [loginGoogle, abrirSesion, router],
  );

  const entrar = useCallback(async () => {
    setError(null);
    setAbriendoHoja(true);

    try {
      const idToken = await obtenerIdTokenGoogle();
      tokenPendiente.current = idToken;
      // `undefined` = el campo no viaja. Distinto de `false`: asi el backend
      // solo lo reclama si tiene que crear la cuenta.
      await canjear(idToken, acepto === true ? true : undefined);
    } catch (fallo) {
      // Cerro la hoja de Google a proposito: no es un error que haya que
      // mostrar, y un cartel rojo despues de cancelar es puro ruido.
      if (fallo instanceof GoogleCancelado) return;

      const delBackend = interpretarError(fallo);

      // No existe la cuenta y nadie acepto nada todavia: se pregunta.
      if (faltaAceptar(delBackend) && tokenPendiente.current) {
        setAceptaEnDialogo(false);
        setErrorConsentimiento(null);
        setPidiendoConsentimiento(true);
        return;
      }

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
  }, [canjear, acepto]);

  /** Segundo intento, ya con la casilla tildada en el dialogo. */
  const confirmarConsentimiento = useCallback(async () => {
    const idToken = tokenPendiente.current;
    if (!idToken || !aceptaEnDialogo) return;

    setError(null);
    setErrorConsentimiento(null);
    try {
      await canjear(idToken, true);
      setPidiendoConsentimiento(false);
    } catch (fallo) {
      // El dialogo NO se cierra: con la casilla ya tildada, reintentar es un
      // toque. Cerrarlo obligaria a pasar de nuevo por la hoja de Google.
      setErrorConsentimiento(
        interpretarError(fallo)?.mensaje ?? 'No pudimos crear tu cuenta. Proba de nuevo.',
      );
    }
  }, [canjear, aceptaEnDialogo]);

  const cancelarConsentimiento = useCallback(() => {
    setPidiendoConsentimiento(false);
    setAceptaEnDialogo(false);
    setErrorConsentimiento(null);
    tokenPendiente.current = null;
  }, []);

  return {
    entrar,
    cargando: abriendoHoja || isLoading,
    error,
    /** Sin client ID configurado no se muestra el boton. */
    disponible: GOOGLE_HABILITADO,
    /** Lo que necesita el dialogo de consentimiento. */
    consentimiento: {
      visible: pidiendoConsentimiento,
      acepto: aceptaEnDialogo,
      cambiar: setAceptaEnDialogo,
      confirmar: confirmarConsentimiento,
      cancelar: cancelarConsentimiento,
      cargando: isLoading,
      error: errorConsentimiento,
    },
  };
}
