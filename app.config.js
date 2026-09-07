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

/** El scheme de iOS es el client ID al reves, sin el sufijo del dominio. */
function schemeDesdeClientId(clientId) {
  if (!clientId) return null;
  const id = clientId.replace(/\.apps\.googleusercontent\.com$/, '');
  return `com.googleusercontent.apps.${id}`;
}

module.exports = ({ config }) => {
  const iosUrlScheme = schemeDesdeClientId(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS);

  // Sin client ID de iOS el plugin no se agrega: pedirlo igual hace fallar el
  // prebuild con "Google Sign In requires iosUrlScheme". Asi el proyecto sigue
  // compilando mientras las credenciales no esten, y el boton se oculta solo.
  const plugins = [...(config.plugins ?? [])];
  if (iosUrlScheme) {
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme }]);
  }

  return { ...config, plugins };
};
