import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

/**
 * Todo lo que toca la libreria de notificaciones vive aca: las features piden
 * un token o un estado, no saben que existe `expo-notifications`.
 *
 * `Platform` si aplica: las notificaciones push son de la plataforma (en web
 * no hay).
 */

/** El back manda los avisos por este canal: tiene que existir en el telefono. */
export const CANAL_AVISOS = 'avisos';

/** Si este dispositivo puede recibir push. Web y emuladores, no. */
export const pushDisponible = Platform.OS !== 'web' && Device.isDevice;

let handlerInstalado = false;

/**
 * Con la app abierta, por defecto no se muestra nada: esto hace que el aviso
 * aparezca igual. Se llama una vez, al cargar el layout raiz.
 */
export function instalarHandlerNotificaciones(): void {
  if (handlerInstalado || Platform.OS === 'web') return;
  handlerInstalado = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Android: el canal va ANTES de pedir el permiso. Sin el canal "avisos",
 * Android no muestra lo que manda el back.
 */
async function asegurarCanal(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL_AVISOS, {
    name: 'Avisos de la app',
    description: 'Mantenimientos, novedades y versiones nuevas',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/** El projectId de EAS: sin el no hay token de Expo (hay que correr `eas init`). */
function projectIdDeEas(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

export type EstadoPermiso =
  'activadas' | 'sinPreguntar' | 'denegadas' | 'bloqueadas' | 'noDisponible';

/**
 * Como estan las notificaciones en este telefono.
 *   sinPreguntar → todavia se puede mostrar el dialogo del sistema
 *   denegadas    → dijo que no, pero se puede volver a preguntar
 *   bloqueadas   → ya no se puede preguntar: solo desde los ajustes del sistema
 */
export async function estadoPermisoNotificaciones(): Promise<EstadoPermiso> {
  if (!pushDisponible) return 'noDisponible';
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'activadas';
  if (!canAskAgain) return 'bloqueadas';
  return status === 'undetermined' ? 'sinPreguntar' : 'denegadas';
}

/**
 * El token de Expo de este telefono, o null si no se puede (web, emulador,
 * permiso denegado, sin projectId). Con `pedirPermiso` muestra el dialogo del
 * sistema si todavia se puede; sin el, solo devuelve el token si ya estaba
 * permitido.
 */
export async function obtenerTokenPush({
  pedirPermiso,
}: {
  pedirPermiso: boolean;
}): Promise<string | null> {
  if (!pushDisponible) return null;

  await asegurarCanal();

  const actual = await Notifications.getPermissionsAsync();
  let { status } = actual;
  if (status !== 'granted' && pedirPermiso && actual.canAskAgain) {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return null;

  const projectId = projectIdDeEas();
  if (!projectId) {
    if (__DEV__) console.warn('Notificaciones: falta extra.eas.projectId (correr `eas init`).');
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

/** Con el permiso bloqueado, lo unico que queda es mandar a los ajustes del sistema. */
export function abrirAjustesDelSistema(): void {
  void Linking.openSettings();
}

/** Lo que trae `data` de una notificacion, sin tipar: lo valida quien lo usa. */
export type RespuestaNotificacion = { id: string; data: unknown };

function aRespuesta(respuesta: Notifications.NotificationResponse): RespuestaNotificacion {
  return {
    id: respuesta.notification.request.identifier,
    data: respuesta.notification.request.content.data,
  };
}

/**
 * Escucha los toques en una notificacion: la que abrio la app en frio (una
 * sola vez) y las que se tocan con la app abierta o en segundo plano. Tambien
 * avisa cuando llega una con la app abierta. Devuelve como desuscribirse.
 */
export function escucharNotificaciones({
  alTocar,
  alLlegar,
}: {
  alTocar: (respuesta: RespuestaNotificacion) => void;
  alLlegar: () => void;
}): () => void {
  if (Platform.OS === 'web') return () => {};

  // La app estaba cerrada y se abrio tocando la notificacion. Se limpia para
  // que un re-montaje no la vuelva a abrir.
  const ultima = Notifications.getLastNotificationResponse();
  if (ultima) {
    Notifications.clearLastNotificationResponse();
    alTocar(aRespuesta(ultima));
  }

  const toque = Notifications.addNotificationResponseReceivedListener((respuesta) =>
    alTocar(aRespuesta(respuesta)),
  );
  const llegada = Notifications.addNotificationReceivedListener(() => alLlegar());

  return () => {
    toque.remove();
    llegada.remove();
  };
}
