import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { GOOGLE_HABILITADO } from '@/config';
import { entrarConGoogle, GoogleCancelado } from '@/services/auth';
import { interpretarError, type ErrorApi } from '@/shared/utils';
import { useAppDispatch } from '@/store';

import { useLoginGoogleMutation } from '../api/authApi';
import { RUTA_CUENTA_SUSPENDIDA } from '../rutas';
import { CODIGO_CUENTA_SUSPENDIDA } from '../schemas';
import { avisoDeSesionMostrado } from '../store/authSlice';
import { useAbrirSesion } from './useAbrirSesion';

/**
 * El campo que nombra el backend en el 400 cuando falta el consentimiento. Va
 * en `detalles.campos`, como todo error de campo (K11).
 */
const CAMPO_TERMINOS = 'aceptoTerminosYCondiciones';

/**
 * El backend rechazo el alta porque nadie acepto los terminos todavia. Es la
 * senal de que esta cuenta de Google NO existe: si existiera, habria entrado.
 */
const faltaAceptar = (detalle: ErrorApi | null): boolean =>
  detalle?.status === 400 && detalle.campos?.[CAMPO_TERMINOS] !== undefined;

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
  const dispatch = useAppDispatch();
  const abrirSesion = useAbrirSesion();
  const [loginGoogle, { isLoading }] = useLoginGoogleMutation();

  const [error, setError] = useState<string | null>(null);
  const [abriendoHoja, setAbriendoHoja] = useState(false);
  /** El ID token del intento que quedo esperando el consentimiento. */
  const tokenPendiente = useRef<string | null>(null);
  const [pidiendoConsentimiento, setPidiendoConsentimiento] = useState(false);
  /**
   * El mail con el que se abrio la hoja de Google. Es solo para mostrarlo en el
   * dialogo: el backend no lo recibe, saca el suyo del ID token verificado.
   */
  const [cuenta, setCuenta] = useState<string | null>(null);
  const [aceptaEnDialogo, setAceptaEnDialogo] = useState(false);
  /** Error del segundo intento. Va DENTRO del dialogo, que queda abierto. */
  const [errorConsentimiento, setErrorConsentimiento] = useState<string | null>(null);

  const canjear = useCallback(
    async (
      idToken: string,
      aceptoTerminosYCondiciones: boolean | undefined,
      /**
       * Baja el dialogo de consentimiento, cuando el canje vino de ahi. Corre
       * DESPUES del unwrap (si el backend falla, el dialogo tiene que quedar
       * abierto) y ANTES de navegar, por lo que explica el comentario de abajo.
       */
      cerrarDialogo?: () => void,
    ) => {
      const sesion = await loginGoogle({ idToken, aceptoTerminosYCondiciones }).unwrap();
      // Ya se uso: no tiene sentido que siga en memoria.
      tokenPendiente.current = null;

      // Cerrar el dialogo y navegar tienen que caer en DOS commits distintos de
      // React, y por eso el `requestAnimationFrame`. El `Modal` de RN monta su
      // contenido en una ventana nativa aparte, colgada del arbol de la
      // pantalla. Si los dos cambios entran en el mismo commit, el
      // `router.replace` de abajo hace que react-native-screens saque la
      // pantalla mientras esa ventana sigue montada, y Fabric revienta al
      // aplicar el diff: "addViewAt failed to insert view [X] into parent [Y]".
      // Un frame alcanza: lo unico que hace falta es que el commit que baja el
      // dialogo se aplique entero antes de que empiece el que desmonta.
      if (cerrarDialogo) {
        cerrarDialogo();
        await new Promise<void>((listo) => {
          requestAnimationFrame(() => listo());
        });
      }

      abrirSesion(sesion);
      // `sesion.caso` distingue una cuenta recien creada ('creada') de una que
      // ya existia. Las tres van a la raiz, que decide segun el `pendiente`.
      // 'vinculada' deja además un aviso de una sola vez: el back invalidó la
      // contraseña anterior (K13), y sin avisarlo la persona la volvería a
      // probar en el próximo login.
      if (sesion.caso === 'vinculada') dispatch(avisoDeSesionMostrado('google-vinculada'));
      router.replace('/');
    },
    [loginGoogle, abrirSesion, router, dispatch],
  );

  const entrar = useCallback(async () => {
    setError(null);
    setAbriendoHoja(true);

    try {
      const { idToken, email } = await entrarConGoogle();
      tokenPendiente.current = idToken;
      setCuenta(email);
      // `undefined` = el campo no viaja. Distinto de `false`: asi el backend
      // solo lo reclama si tiene que crear la cuenta.
      await canjear(idToken, acepto === true ? true : undefined);
    } catch (fallo) {
      // Cerro la hoja de Google a proposito: no es un error que haya que
      // mostrar, y un cartel rojo despues de cancelar es puro ruido.
      if (fallo instanceof GoogleCancelado) return;

      const delBackend = interpretarError(fallo);

      // Suspendida: el cartel con el motivo lo muestra su propia pantalla.
      if (delBackend?.codigo === CODIGO_CUENTA_SUSPENDIDA) {
        router.replace(RUTA_CUENTA_SUSPENDIDA);
        return;
      }

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
  }, [canjear, acepto, router]);

  /** Segundo intento, ya con la casilla tildada en el dialogo. */
  const confirmarConsentimiento = useCallback(async () => {
    const idToken = tokenPendiente.current;
    if (!idToken || !aceptaEnDialogo) return;

    setError(null);
    setErrorConsentimiento(null);
    try {
      // El cierre del dialogo va como callback y no despues del await: tiene
      // que pasar antes de que `canjear` navegue, no despues.
      await canjear(idToken, true, () => setPidiendoConsentimiento(false));
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
    setCuenta(null);
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
      /** Con que cuenta de Google se esta por dar de alta. */
      cuenta,
      acepto: aceptaEnDialogo,
      cambiar: setAceptaEnDialogo,
      confirmar: confirmarConsentimiento,
      cancelar: cancelarConsentimiento,
      cargando: isLoading,
      error: errorConsentimiento,
    },
  };
}
