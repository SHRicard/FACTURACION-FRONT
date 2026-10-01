/**
 * Config dinamica de Expo.
 *
 * `app.json` sigue siendo la fuente de verdad de todo lo estatico: este archivo
 * recibe su contenido en `config` y solo le agrega lo que depende del entorno.
 *
 * Existe por el plugin de Google Sign-In: necesita un `iosUrlScheme` que se
 * deriva del client ID de iOS, y ese valor vive en el `.env` (cambia entre
 * quien compila). Meterlo a mano en `app.json` obligaria a editar dos archivos
 * cada vez y a commitear el client ID.
 */

const fs = require('fs');
const path = require('path');

/**
 * El `google-services.json` de Firebase: por él Expo manda las notificaciones
 * de Android (FCM, docs/NOTIFICACIONES.md 3.2). Se suma solo si el archivo
 * está, igual que el plugin de Google Sign-In: sin él el proyecto sigue
 * compilando y la app anda, solo que no recibe notificaciones.
 */
const GOOGLE_SERVICES = './google-services.json';
const hayGoogleServices = fs.existsSync(path.join(__dirname, GOOGLE_SERVICES));

/** El scheme de iOS es el client ID al reves, sin el sufijo del dominio. */
function schemeDesdeClientId(clientId) {
  if (!clientId) return null;
  const id = clientId.replace(/\.apps\.googleusercontent\.com$/, '');
  return `com.googleusercontent.apps.${id}`;
}

/** Los perfiles de EAS que terminan en la tienda. */
const PERFILES_DE_TIENDA = ['production'];

/**
 * Corta un build de tienda al que le faltan las variables de entorno.
 *
 * Un build de tienda sin ellas sale andando pero roto y en silencio: apunta a
 * localhost, o `config/index.ts` oculta el botón de Google y quien se registró
 * con Google no puede entrar. Mejor que el build falle a que se publique eso.
 *
 * El desarrollo local y `expo run:android` no se ven afectados:
 * `EAS_BUILD_PROFILE` solo existe en los builds de EAS.
 */
function exigirVariablesDeTienda() {
  const perfil = process.env.EAS_BUILD_PROFILE;
  if (!PERFILES_DE_TIENDA.includes(perfil)) return;

  const problemas = [];
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
  if (!apiUrl.startsWith('https://') || /localhost|127\.0\.0\.1|10\.0\.2\.2/.test(apiUrl)) {
    problemas.push('EXPO_PUBLIC_API_BASE_URL tiene que ser una URL https que no sea localhost');
  }
  if (!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB) {
    problemas.push(
      'falta EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB (sin él no aparece "Continuar con Google" y quien se registró con Google no puede entrar)',
    );
  }

  if (problemas.length > 0) {
    throw new Error(
      `Build "${perfil}" mal configurado:\n- ${problemas.join('\n- ')}\nCargalas como variables de entorno de EAS para ese perfil (el .env no se sube: está en .gitignore).`,
    );
  }
}

module.exports = ({ config }) => {
  exigirVariablesDeTienda();

  const iosUrlScheme = schemeDesdeClientId(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS);

  // Sin client ID de iOS el plugin no se agrega: pedirlo igual hace fallar el
  // prebuild con "Google Sign In requires iosUrlScheme". Asi el proyecto sigue
  // compilando mientras las credenciales no esten, y el boton se oculta solo.
  const plugins = [...(config.plugins ?? [])];
  if (iosUrlScheme) {
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme }]);
  }

  /*
   * El projectId de EAS lo escribe `eas init` en app.json (extra.eas). Sin
   * él no hay token de Expo para las notificaciones; se puede pasar también por
   * EAS_PROJECT_ID para no commitearlo.
   */
  const projectId = config.extra?.eas?.projectId ?? process.env.EAS_PROJECT_ID;
  const extra = projectId
    ? { ...config.extra, eas: { ...config.extra?.eas, projectId } }
    : config.extra;

  const android = hayGoogleServices
    ? { ...config.android, googleServicesFile: GOOGLE_SERVICES }
    : config.android;

  return { ...config, plugins, android, extra };
};
