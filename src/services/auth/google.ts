import {
  GoogleSignin,
  isSuccessResponse,
  type SignInResponse,
} from '@react-native-google-signin/google-signin';

import { GOOGLE_CLIENT_ID_IOS, GOOGLE_CLIENT_ID_WEB, GOOGLE_HABILITADO } from '@/config';

/**
 * Puente con la hoja nativa de Google. Es la UNICA parte de la app que conoce
 * la libreria: el resto solo pide "traeme un ID token".
 *
 * Al backend le mandamos SOLO el ID token, nunca el email ni el nombre: esos
 * los saca el backend del token ya verificado contra las claves publicas de
 * Google. Si confiaramos en un email suelto del body, cualquiera entraria como
 * cualquiera con un curl.
 */

/** La persona cerro la hoja de Google. No es un error: no se muestra nada. */
export class GoogleCancelado extends Error {
  constructor() {
    super('Cancelado por el usuario');
    this.name = 'GoogleCancelado';
  }
}

let configurado = false;

/**
 * Se llama una vez al arrancar la app.
 *
 * `webClientId` es obligatorio aunque estemos en iOS o Android: es el que hace
 * que Google devuelva un ID token. Sin el vuelve solo un access token, que al
 * backend no le sirve.
 */
export function configurarGoogle(): void {
  if (configurado || !GOOGLE_HABILITADO) return;

  GoogleSignin.configure({
    webClientId: GOOGLE_CLIENT_ID_WEB,
    // En Android este campo no aplica; la libreria lo ignora si viene vacio.
    ...(GOOGLE_CLIENT_ID_IOS ? { iosClientId: GOOGLE_CLIENT_ID_IOS } : {}),
    // Solo identidad: no pedimos Drive, Calendar ni nada que obligue a la
    // persona a aceptar permisos que no vamos a usar.
    scopes: ['profile', 'email'],
    offlineAccess: false,
  });

  configurado = true;
}

/**
 * Abre la hoja de Google y devuelve el ID token para mandarle al backend.
 *
 * Ojo con la version: desde la v13 de la libreria cancelar NO tira excepcion,
 * vuelve como `{ type: 'cancelled' }`. Por eso se discrimina con
 * `isSuccessResponse` en vez de atrapar `statusCodes.SIGN_IN_CANCELLED`, que es
 * lo que sigue circulando en los ejemplos viejos y aca ya no se cumple nunca.
 */
export async function obtenerIdTokenGoogle(): Promise<string> {
  configurarGoogle();

  // En Android verifica que haya Google Play Services; en iOS no hace nada.
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const respuesta: SignInResponse = await GoogleSignin.signIn();

  if (!isSuccessResponse(respuesta)) throw new GoogleCancelado();

  const { idToken } = respuesta.data;
  if (!idToken) {
    // Casi siempre es que falta el webClientId en configure().
    throw new Error('Google no devolvio un ID token');
  }

  return idToken;
}

/**
 * Cerrar la sesion del backend no cierra la de Google: sin esto, el siguiente
 * "Continuar con Google" vuelve a entrar solo con la misma cuenta y no hay
 * forma de cambiar de usuario desde la app.
 */
export async function cerrarSesionGoogle(): Promise<void> {
  if (!GOOGLE_HABILITADO) return;
  try {
    await GoogleSignin.signOut();
  } catch {
    // Si no habia sesion de Google abierta, no es un error que importe.
  }
}
