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
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/**
 * Clave de encriptacion del storage seguro (token de auth).
 * Maximo 16 bytes con AES-128 (default de MMKV).
 *
 * TODO(seguridad): al ser EXPO_PUBLIC_ queda visible en el bundle. Para produccion,
 * generar la clave en el device y guardarla en el Keychain/Keystore con expo-secure-store.
 */
export const SECURE_STORAGE_KEY = process.env.EXPO_PUBLIC_SECURE_STORAGE_KEY ?? 'dev-insecure-k';
