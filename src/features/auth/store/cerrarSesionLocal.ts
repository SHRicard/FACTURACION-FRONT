import type { Dispatch } from '@reduxjs/toolkit';

import { baseApi } from '@/services/api';
import { SecureStorageKeys, secureStorageService } from '@/services/storage';

import { sesionCerrada } from './authSlice';

/**
 * EL cierre de sesión del dispositivo. Lo usan las tres salidas: la manual
 * (`useSesion`), el 401 a mitad de uso (`sesionCaidaMiddleware`) y el 401 del
 * arranque (`useArranqueSesion`).
 *
 * Que sea uno solo es lo que garantiza que ninguna salida deje atrás el token,
 * el usuario o la caché de RTK Query de la cuenta anterior. Sin el reset, la
 * próxima cuenta que entre en este teléfono —de otra marca— ve los clientes y
 * las deudas ajenas durante los 60 s que dura la caché.
 *
 * `resetApiState` además limpia `internalState.currentSubscriptions`, y eso
 * incluye la suscripción del `/auth/me` lazy de `ArranqueSesion`: era la mitad
 * del loop que devolvía al login después de cada login (C1).
 *
 * NO cierra la sesión de Google: eso es solo del cierre manual, que es cuando
 * la persona quiere poder entrar con otra cuenta.
 *
 * ⚠️ `sesionCerrada` no se despacha fuera de acá. `useAbrirSesion` vacía la
 * caché solo al cambiar de cuenta porque confía en que toda salida pasó por
 * este cierre.
 */
export function cerrarSesionLocal(dispatch: Dispatch): void {
  // El storage se limpia acá y no en un reducer: los reducers son puros.
  secureStorageService.remove(SecureStorageKeys.AUTH_TOKEN);
  dispatch(sesionCerrada());
  dispatch(baseApi.util.resetApiState());
}
