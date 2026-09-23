import Constants from 'expo-constants';

/**
 * Configuracion de la app.
 *
 * Las variables con prefijo EXPO_PUBLIC_ las inlinea Expo CLI en el bundle en
 * build time. Tienen que referenciarse de forma estatica (`process.env.EXPO_PUBLIC_X`):
 * ni destructuring ni notacion de corchetes se inlinean.
 *
 * No pongas secretos aca: quedan en texto plano dentro del bundle.
 */

/** URL base de la API REST. Se sobreescribe con EXPO_PUBLIC_API_BASE_URL en el .env. */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

/**
 * Clave de encriptacion del storage seguro (token de auth).
 * Maximo 16 bytes con AES-128 (default de MMKV).
 *
 * TODO(seguridad): al ser EXPO_PUBLIC_ queda visible en el bundle. Para produccion,
 * generar la clave en el device y guardarla en el Keychain/Keystore con expo-secure-store.
 */
export const SECURE_STORAGE_KEY = process.env.EXPO_PUBLIC_SECURE_STORAGE_KEY ?? 'dev-insecure-k';

/**
 * Client IDs de Google. NO son secretos: identifican a la app, no la autentican.
 *
 * El WEB es obligatorio en las tres plataformas, tambien en iOS y Android: es el
 * que hace que Google devuelva un ID token. Sin el vuelve solo un access token,
 * que al backend no le sirve para verificar quien es la persona.
 */
export const GOOGLE_CLIENT_ID_WEB = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? '';
export const GOOGLE_CLIENT_ID_IOS = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? '';

/**
 * Sin el client ID web no hay forma de pedir un ID token, asi que el boton de
 * Google se oculta en vez de ofrecer algo que va a fallar. Permite trabajar en
 * el proyecto sin tener las credenciales cargadas.
 */
export const GOOGLE_HABILITADO = GOOGLE_CLIENT_ID_WEB !== '';

/**
 * La `expo.version` de app.json. Viaja en `X-App-Version` para que el back
 * pueda exigir una versión mínima (responde 426, K8) y en el reporte de
 * errores (K12). null si Constants no la trae: sin versión no se manda el
 * header y el back no bloquea.
 *
 * ⚠️ Para poder exigirla, cada release tiene que subir `version`, no solo el
 * versionCode: si no, todas las builds dicen lo mismo.
 */
export const VERSION_APP: string | null = Constants.expoConfig?.version ?? null;
