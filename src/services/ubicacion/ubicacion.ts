import type * as ExpoLocation from 'expo-location';
import { Linking, Platform } from 'react-native';

/**
 * Puente con el GPS del dispositivo. Es la UNICA parte de la app que conoce
 * `expo-location`: el resto solo pide "decime donde estoy, como direccion".
 *
 * ⚠️ La libreria se carga con `import()` recien al usarla, NO arriba del
 * archivo. Tiene codigo nativo: un build del telefono anterior a instalarla no
 * la trae, y un import de modulo haria que la app entera se cierre al abrir
 * (expo-router carga todas las rutas al arrancar). Asi, en ese build solo falla
 * el boton de ubicacion, con un aviso, y todo lo demas sigue andando.
 */

/** Lo que puede pasar al pedir la ubicacion. Ninguno es un error inesperado. */
export type ResultadoUbicacion =
  | { tipo: 'ok'; direccion: string; latitud: number; longitud: number }
  /** `puedePreguntar` false: lo negaron "para siempre"; solo queda Ajustes. */
  | { tipo: 'sinPermiso'; puedePreguntar: boolean }
  | { tipo: 'gpsApagado' }
  /** No llego una posicion a tiempo (adentro de un local, sin señal). */
  | { tipo: 'sinSenal' }
  /** Hay posicion pero no se pudo traducir a calle (sin red, o en web). */
  | { tipo: 'sinDireccion'; latitud: number; longitud: number }
  /** El build instalado no trae el modulo nativo: hay que actualizar la app. */
  | { tipo: 'noDisponible' };

/** Cuanto se espera al GPS antes de rendirse. Adentro de un local puede no llegar nunca. */
const ESPERA_MAXIMA_MS = 15_000;

async function cargarLibreria(): Promise<typeof ExpoLocation | null> {
  try {
    return await import('expo-location');
  } catch {
    return null;
  }
}

/** Corta una promesa que puede no resolverse nunca (el GPS sin señal). */
function conLimite<T>(promesa: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promesa,
    new Promise<null>((resolver) => setTimeout(() => resolver(null), ms)),
  ]);
}

/**
 * El permiso clasico del sistema, "mientras se usa la app". Si ya lo dieron no
 * se vuelve a preguntar; si lo negaron para siempre, el sistema ya no muestra
 * el dialogo y hay que mandar a Ajustes.
 */
async function pedirPermiso(
  Location: typeof ExpoLocation,
): Promise<{ concedido: boolean; puedePreguntar: boolean }> {
  const actual = await Location.getForegroundPermissionsAsync();
  if (actual.granted) return { concedido: true, puedePreguntar: true };
  if (!actual.canAskAgain) return { concedido: false, puedePreguntar: false };

  const pedido = await Location.requestForegroundPermissionsAsync();
  return { concedido: pedido.granted, puedePreguntar: pedido.canAskAgain };
}

/**
 * Con la ubicacion del telefono apagada, Android puede mostrar su propio
 * dialogo de "activar ubicacion" sin salir de la app. Si la persona dice que
 * no (o es iOS, que no lo tiene), queda apagada.
 */
async function asegurarGpsPrendido(Location: typeof ExpoLocation): Promise<boolean> {
  if (await Location.hasServicesEnabledAsync()) return true;
  if (Platform.OS !== 'android') return false;
  try {
    await Location.enableNetworkProviderAsync();
    return await Location.hasServicesEnabledAsync();
  } catch {
    return false;
  }
}

/** `'Av. Siempreviva 742, Springfield'`: calle y numero, y la ciudad. */
function armarDireccion(lugar: ExpoLocation.LocationGeocodedAddress): string | null {
  const calle = [lugar.street, lugar.streetNumber].filter(Boolean).join(' ');
  // En Android `name` suele ser "calle numero"; sirve cuando `street` no viene.
  const primeraParte = calle || lugar.name;
  const ciudad = lugar.city ?? lugar.subregion ?? lugar.district ?? lugar.region;

  const partes = [primeraParte, ciudad].filter(
    (parte, indice, todas): parte is string => Boolean(parte) && todas.indexOf(parte) === indice,
  );
  if (partes.length > 0) return partes.join(', ');
  return lugar.formattedAddress ?? null;
}

/**
 * Pide el permiso, lee la posicion y la traduce a una direccion escrita.
 *
 * Se pide "mientras se usa la app" y una sola lectura: no se sigue a nadie en
 * segundo plano ni se guardan coordenadas, solo el texto que queda en el campo.
 */
export async function obtenerDireccionActual(): Promise<ResultadoUbicacion> {
  const Location = await cargarLibreria();
  if (!Location) return { tipo: 'noDisponible' };

  let permiso: { concedido: boolean; puedePreguntar: boolean };
  try {
    permiso = await pedirPermiso(Location);
  } catch {
    // El modulo JS existe pero el nativo no: build viejo.
    return { tipo: 'noDisponible' };
  }
  if (!permiso.concedido) return { tipo: 'sinPermiso', puedePreguntar: permiso.puedePreguntar };

  if (!(await asegurarGpsPrendido(Location))) return { tipo: 'gpsApagado' };

  // "Balanced" alcanza para una direccion (decenas de metros) y responde mucho
  // mas rapido que la maxima precision, que puede tardar un minuto adentro.
  const posicion =
    (await conLimite(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      ESPERA_MAXIMA_MS,
    )) ?? (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 }));
  if (!posicion) return { tipo: 'sinSenal' };

  const { latitude: latitud, longitude: longitud } = posicion.coords;

  try {
    const [lugar] = await Location.reverseGeocodeAsync({ latitude: latitud, longitude: longitud });
    const direccion = lugar ? armarDireccion(lugar) : null;
    if (direccion) return { tipo: 'ok', direccion, latitud, longitud };
  } catch {
    // Sin red, o en web (donde traducir coordenadas a calle pide una API key).
  }
  return { tipo: 'sinDireccion', latitud, longitud };
}

/** Para cuando el permiso quedo negado para siempre: solo se cambia desde Ajustes. */
export function abrirAjustesDeLaApp(): Promise<void> {
  return Linking.openSettings();
}
