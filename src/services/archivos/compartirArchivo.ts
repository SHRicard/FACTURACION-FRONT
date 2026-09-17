import type * as ExpoFileSystem from 'expo-file-system';
import type * as ExpoSharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Bajar un archivo protegido (con el token) y abrir el menu de compartir del
 * sistema. En Android es la hoja nativa: WhatsApp, Gmail, Drive, Bluetooth, lo
 * que tenga instalado el telefono.
 *
 * ⚠️ Las dos librerias se cargan con `import()` recien al usarlas, igual que
 * la galeria y la ubicacion: tienen codigo nativo, y un build del telefono
 * anterior a instalarlas no las trae. Asi, en ese build solo falla el boton.
 */

export interface ArchivoACompartir {
  url: string;
  /** Los headers del pedido: el `Authorization`. */
  headers: Record<string, string>;
  /** Con extension. Es el nombre con que le llega a quien lo recibe. */
  nombre: string;
  mimeType: string;
  /** Solo iOS: el tipo del archivo para su hoja de compartir. */
  uti?: string;
  /** El titulo del menu de compartir en Android. */
  tituloMenu: string;
}

export type ResultadoCompartir =
  | { tipo: 'ok' }
  /** No se pudo bajar. `status` es el codigo HTTP, o null si no hubo respuesta. */
  | { tipo: 'fallo'; status: number | null }
  /** El build no trae los modulos, o el dispositivo no tiene como compartir. */
  | { tipo: 'noDisponible' };

async function cargarLibrerias(): Promise<[typeof ExpoFileSystem, typeof ExpoSharing] | null> {
  try {
    return await Promise.all([import('expo-file-system'), import('expo-sharing')]);
  } catch {
    return null;
  }
}

/** La descarga falla con "HTTP 403" y no crea el archivo. Sin codigo = sin red. */
function statusDelError(error: unknown): number | null {
  const mensaje = error instanceof Error ? error.message : String(error);
  const codigo = /HTTP (\d{3})/.exec(mensaje)?.[1];
  return codigo ? Number(codigo) : null;
}

async function compartirEnNativo(archivo: ArchivoACompartir): Promise<ResultadoCompartir> {
  const librerias = await cargarLibrerias();
  if (!librerias) return { tipo: 'noDisponible' };
  const [FileSystem, Sharing] = librerias;

  try {
    if (!(await Sharing.isAvailableAsync())) return { tipo: 'noDisponible' };
  } catch {
    // El modulo JS existe pero el nativo no: build viejo.
    return { tipo: 'noDisponible' };
  }

  /*
   * Al cache y con nombre fijo por archivo: la proxima vez se pisa
   * (`idempotent`), y el sistema limpia el cache solo. No se borra despues de
   * compartir porque la app que lo recibe (WhatsApp) puede leerlo mas tarde.
   */
  let descargado: ExpoFileSystem.File;
  try {
    descargado = await FileSystem.File.downloadFileAsync(
      archivo.url,
      new FileSystem.File(FileSystem.Paths.cache, archivo.nombre),
      { headers: archivo.headers, idempotent: true },
    );
  } catch (error) {
    return { tipo: 'fallo', status: statusDelError(error) };
  }

  try {
    await Sharing.shareAsync(descargado.uri, {
      mimeType: archivo.mimeType,
      UTI: archivo.uti,
      dialogTitle: archivo.tituloMenu,
    });
  } catch {
    return { tipo: 'noDisponible' };
  }
  return { tipo: 'ok' };
}

/**
 * En el navegador: la hoja de compartir del sistema si la hay (un celular), y
 * si no (una compu), el PDF en otra pestaña, desde donde se descarga o imprime.
 */
async function compartirEnWeb(archivo: ArchivoACompartir): Promise<ResultadoCompartir> {
  let respuesta: Response;
  try {
    respuesta = await fetch(archivo.url, { headers: archivo.headers });
  } catch {
    return { tipo: 'fallo', status: null };
  }
  if (!respuesta.ok) return { tipo: 'fallo', status: respuesta.status };

  const blob = await respuesta.blob();
  const conNombre = new File([blob], archivo.nombre, { type: archivo.mimeType });

  if (navigator.canShare?.({ files: [conNombre] })) {
    try {
      await navigator.share({ files: [conNombre], title: archivo.tituloMenu });
      return { tipo: 'ok' };
    } catch (error) {
      // Cerrar la hoja sin elegir nada no es un error.
      if (error instanceof DOMException && error.name === 'AbortError') return { tipo: 'ok' };
    }
  }

  const enlace = URL.createObjectURL(blob);
  window.open(enlace, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(enlace), 60_000);
  return { tipo: 'ok' };
}

/** Baja el archivo y abre el menu de compartir. No tira: todo sale en el resultado. */
export function compartirArchivo(archivo: ArchivoACompartir): Promise<ResultadoCompartir> {
  return Platform.OS === 'web' ? compartirEnWeb(archivo) : compartirEnNativo(archivo);
}
