import { useCallback, useEffect, useState } from 'react';

import { cerrarSesionGoogle, configurarGoogle } from '@/services/auth';
import { interpretarError, type ErrorApi } from '@/shared/utils';
import { useAppDispatch, useAppSelector } from '@/store';

import { useLazyUsuarioActualQuery } from '../api/authApi';
import {
  selectEstaAutenticado,
  selectSesionVerificada,
  sesionRestaurada,
} from '../store/authSlice';
import { cerrarSesionLocal } from '../store/cerrarSesionLocal';

/**
 * Por qué no se pudo verificar la sesión, cuando no fue la sesión: el texto
 * que acompaña a "No pudimos verificar tu sesión".
 */
function textoDelFallo(detalle: ErrorApi | null): string {
  if (detalle?.codigo === 'RESPUESTA_INESPERADA') {
    return 'El servidor respondió algo que esta versión no entiende. Probá de nuevo o actualizá la app.';
  }
  const status = detalle?.status ?? null;
  if (status !== null && status >= 500) {
    return 'El servidor no está respondiendo. Probá de nuevo en un rato: tu sesión sigue guardada.';
  }
  // Sin respuesta: sin red, el tope de tiempo (que en nativo llega como
  // FETCH_ERROR) o algo en el medio que no es el backend.
  if (!detalle || status === null) {
    return 'Revisá la señal o el wifi y tocá Reintentar. Tu sesión sigue guardada.';
  }
  return detalle.mensaje;
}

/**
 * Rehidrata la sesion al abrir la app.
 *
 * Al arrancar, el token de la vez anterior sigue en el storage pero no sabemos
 * si el backend lo acepta todavia: pudo vencer (dura 7 dias) o quedar invalidado
 * porque la persona cambio su contrasena desde otro lado. Un `/auth/me` lo
 * responde, y de paso trae el usuario al dia (si le cambiaron el nombre o el
 * rol, lo vemos aca y no con datos viejos).
 *
 * Mientras dura, `verificada` es false y la app NO tiene que decidir todavia a
 * donde mandar a la persona: sin esa espera, alguien con la sesion abierta ve
 * un salto a /login antes de volver a la home.
 *
 * Solo un 401 cierra la sesión. Cualquier otra falla (sin red, el tope de 20 s,
 * un 5xx, una respuesta que no pasa el schema) deja el token y llena `fallo`:
 * la pantalla ofrece Reintentar o Salir.
 *
 * Se monta UNA sola vez, en el layout raiz.
 */
export function useArranqueSesion() {
  const dispatch = useAppDispatch();
  const verificada = useAppSelector(selectSesionVerificada);
  const estaAutenticado = useAppSelector(selectEstaAutenticado);
  const [pedirUsuario] = useLazyUsuarioActualQuery();

  /** Por qué no se pudo verificar, cuando no fue la sesión. */
  const [fallo, setFallo] = useState<string | null>(null);
  /** Sube con cada "Reintentar" para volver a correr la verificación. */
  const [intento, setIntento] = useState(0);

  // Configura la libreria de Google una sola vez. Va aca y no en el momento de
  // tocar el boton para que la hoja nativa abra sin demora; es sincronico y no
  // hace red, asi que no retrasa el arranque.
  useEffect(() => {
    configurarGoogle();
  }, []);

  useEffect(() => {
    // Ya resuelto: o no habia token, o alguien inicio sesion en el medio.
    if (verificada) return;

    let vigente = true;

    void (async () => {
      try {
        // El trigger lazy fuerza el pedido (no usa la caché), así que cada
        // reintento vuelve a salir al backend.
        const actual = await pedirUsuario().unwrap();
        if (vigente) dispatch(sesionRestaurada(actual));
      } catch (error) {
        if (!vigente) return;
        const detalle = interpretarError(error);
        // Token vencido o revocado: no hay sesión. Es idempotente: normalmente
        // el middleware ya cerró por este mismo 401.
        if (detalle?.status === 401) {
          cerrarSesionLocal(dispatch);
          return;
        }
        // Sin señal o con el backend reiniciándose, el token sigue valiendo 7
        // días: borrarlo obligaba a tipear la contraseña con el cliente
        // esperando. Mismo criterio que `useRefrescarSesion`.
        setFallo(textoDelFallo(detalle));
      }
    })();

    return () => {
      vigente = false;
    };
  }, [verificada, intento, pedirUsuario, dispatch]);

  const reintentar = useCallback(() => {
    setFallo(null);
    setIntento((n) => n + 1);
  }, []);

  /**
   * Salir sin haber podido verificar. Sin router: el Stack todavía no está
   * montado; `sesionCerrada` pone el arranque en 'listo' y EntradaScreen manda
   * a /login.
   */
  const salir = useCallback(() => {
    setFallo(null);
    void cerrarSesionGoogle();
    cerrarSesionLocal(dispatch);
  }, [dispatch]);

  return { verificada, estaAutenticado, fallo, reintentar, salir };
}
