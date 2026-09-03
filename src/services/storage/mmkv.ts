import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

import { SECURE_STORAGE_KEY } from '@/config';

/**
 * Instancias de MMKV. NO las uses directo desde componentes ni features:
 * todo el acceso pasa por `storageService` / `secureStorageService`.
 *
 * MMKV v4 es un Nitro Module (codigo nativo) -> no corre en Expo Go.
 * Requiere development build (`npx expo run:android` / build EAS `development`).
 */

/**
 * En web MMKV no usa el motor nativo: cae a `localStorage`, que no soporta
 * encriptacion. Pasarle `encryptionKey` ahi tira al CREAR la instancia, y como
 * esto corre a nivel de modulo se lleva puesta toda la app.
 *
 * Web no es un target de este proyecto (es una app mobile), pero igual no puede
 * romper el bundle: `npm run web` y el render estatico tienen que arrancar.
 */
const soportaEncriptacion = Platform.OS !== 'web';

/** Storage general: preferencias, cache liviana, flags de UI. */
export const storage = createMMKV({ id: 'facturacion.app' });

/** Storage separado para credenciales (token de auth). Encriptado solo en nativo. */
export const secureStorage = createMMKV(
  soportaEncriptacion
    ? { id: 'facturacion.secure', encryptionKey: SECURE_STORAGE_KEY }
    : { id: 'facturacion.secure' },
);

if (__DEV__ && !soportaEncriptacion) {
  console.warn(
    '[storage] En web el storage "seguro" NO esta encriptado: es localStorage plano. ' +
      'No guardes credenciales reales corriendo en web.',
  );
}

/**
 * Si se puede tocar el storage ahora mismo.
 *
 * En nativo siempre. En web, la implementacion de MMKV va contra `localStorage`
 * y tira si no hay DOM: eso pasa durante el render estatico de expo-router
 * (`web.output: "static"` en app.json), que corre en Node.
 */
export const storageDisponible =
  Platform.OS !== 'web' || (typeof window !== 'undefined' && window.document != null);
