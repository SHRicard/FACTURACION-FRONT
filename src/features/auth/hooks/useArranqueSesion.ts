import { useEffect } from 'react';

import { configurarGoogle } from '@/services/auth';
import { SecureStorageKeys, secureStorageService } from '@/services/storage';
import { useAppDispatch, useAppSelector } from '@/store';

import { useLazyUsuarioActualQuery } from '../api/authApi';
import {
  selectEstaAutenticado,
  selectSesionVerificada,
  sesionCerrada,
  sesionRestaurada,
} from '../store/authSlice';

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
 * Se monta UNA sola vez, en el layout raiz.
 */
export function useArranqueSesion() {
  const dispatch = useAppDispatch();
  const verificada = useAppSelector(selectSesionVerificada);
  const estaAutenticado = useAppSelector(selectEstaAutenticado);
  const [pedirUsuario] = useLazyUsuarioActualQuery();

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
        const actual = await pedirUsuario().unwrap();
        if (vigente) dispatch(sesionRestaurada(actual));
      } catch {
        // Token vencido, revocado, o el backend no contesta. En cualquier caso
        // no hay sesion utilizable: se limpia y se sigue como anonimo.
        secureStorageService.remove(SecureStorageKeys.AUTH_TOKEN);
        if (vigente) dispatch(sesionCerrada());
      }
    })();

    return () => {
      vigente = false;
    };
  }, [verificada, pedirUsuario, dispatch]);

  return { verificada, estaAutenticado };
}
