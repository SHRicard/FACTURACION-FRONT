import type * as ExpoImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { z } from 'zod';

/**
 * Puente con la galeria de fotos y con las subidas firmadas. Es la UNICA parte
 * de la app que conoce `expo-image-picker`: el resto solo pide "dame una
 * imagen" y "subila con esta firma".
 *
 * ⚠️ La libreria se carga con `import()` recien al usarla, NO arriba del
 * archivo, igual que la ubicacion. Tiene codigo nativo: un build del telefono
 * anterior a instalarla no la trae, y un import de modulo haria que la app
 * entera se cierre al abrir (expo-router carga todas las rutas al arrancar).
 * Asi, en ese build solo falla el boton, con un aviso.
 */

/** Una imagen elegida, lista para mandar en un FormData. */
export interface ImagenElegida {
  uri: string;
  nombre: string;
  /** MIME: `image/png`, `image/jpeg`, `image/webp`. */
  tipo: string;
  /** Solo en web: el `File` del navegador, que es lo que acepta su FormData. */
  archivoWeb?: File;
}

export type ResultadoEleccion =
  | { tipo: 'ok'; imagen: ImagenElegida }
  | { tipo: 'cancelado' }
  /** Eligio un formato que no esta en la lista (un GIF, una HEIC). */
  | { tipo: 'formatoInvalido' }
  /** El build instalado no trae el modulo nativo: hay que actualizar la app. */
  | { tipo: 'noDisponible' };

interface OpcionesEleccion {
  /** Extensiones aceptadas, en minuscula: `['png', 'jpg', 'jpeg', 'webp']`. */
  formatos: readonly string[];
}

async function cargarLibreria(): Promise<typeof ExpoImagePicker | null> {
  try {
    return await import('expo-image-picker');
  } catch {
    return null;
  }
}

/** `png`, `jpeg`, `webp`: del MIME si vino, si no del nombre o la uri. */
function extensionDe(asset: ExpoImagePicker.ImagePickerAsset): string | null {
  const delMime = asset.mimeType?.split('/')[1];
  if (delMime) return delMime.toLowerCase();
  const nombre = asset.fileName ?? asset.uri.split('?')[0] ?? '';
  return /\.([a-z0-9]+)$/i.exec(nombre)?.[1]?.toLowerCase() ?? null;
}

/**
 * Abre la galeria del sistema para elegir UNA imagen, con recorte.
 *
 * No pide permiso: tanto Android como iOS muestran su propio selector y a la
 * app solo le llega la foto elegida. El selector no deja filtrar por formato,
 * asi que se chequea al volver.
 */
export async function elegirImagen({ formatos }: OpcionesEleccion): Promise<ResultadoEleccion> {
  const ImagePicker = await cargarLibreria();
  if (!ImagePicker) return { tipo: 'noDisponible' };

  let resultado: ExpoImagePicker.ImagePickerResult;
  try {
    resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      // Una foto del local suele traer de mas: se recorta antes de subir.
      allowsEditing: true,
      quality: 0.9,
    });
  } catch {
    // El modulo JS existe pero el nativo no: build viejo.
    return { tipo: 'noDisponible' };
  }

  const asset = resultado.canceled ? undefined : resultado.assets[0];
  if (!asset) return { tipo: 'cancelado' };

  const extension = extensionDe(asset);
  if (!extension || !formatos.includes(extension)) return { tipo: 'formatoInvalido' };

  return {
    tipo: 'ok',
    imagen: {
      uri: asset.uri,
      nombre: asset.fileName ?? `imagen.${extension}`,
      tipo: asset.mimeType ?? `image/${extension === 'jpg' ? 'jpeg' : extension}`,
      archivoWeb: asset.file,
    },
  };
}

// ─────────────────────────── Subida firmada ───────────────────────────

/** Lo que da un backend para subir directo a un storage: a donde, y con que campos firmados. */
export interface FirmaSubida {
  urlSubida: string;
  /** Van TAL CUAL: si se cambia o se saca uno, la firma no coincide y la rechazan. */
  campos: Record<string, string | number>;
}

export type ResultadoSubida =
  | { tipo: 'ok'; version: number }
  /** El storage dijo que no: firma vencida, formato o tamaño fuera de lo firmado. */
  | { tipo: 'rechazada' }
  | { tipo: 'sinConexion' };

/** Cloudinary responde mucho mas; de aca solo importa la `version`. */
const respuestaSubidaSchema = z.object({ version: z.number() });

/** Una foto por datos moviles puede tardar; mas de esto, se da por cortada. */
const ESPERA_MAXIMA_SUBIDA_MS = 60_000;

function leerJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

/** El `file` del FormData: en web un Blob de verdad; en nativo, la uri la lee React Native. */
async function archivoParaFormData(imagen: ImagenElegida): Promise<Blob> {
  if (Platform.OS === 'web') {
    return imagen.archivoWeb ?? (await (await fetch(imagen.uri)).blob());
  }
  return { uri: imagen.uri, name: imagen.nombre, type: imagen.tipo } as unknown as Blob;
}

/**
 * Sube la imagen directo al storage (Cloudinary), sin pasar por nuestro
 * backend: el archivo en `file` y todos los campos de la firma.
 *
 * Va con XMLHttpRequest y no con fetch porque fetch no avisa cuanto lleva
 * subido, y con una foto por datos moviles la barra de progreso importa.
 * `alAvanzar` recibe una fraccion de 0 a 1.
 */
export async function subirConFirma(
  firma: FirmaSubida,
  imagen: ImagenElegida,
  alAvanzar?: (fraccion: number) => void,
): Promise<ResultadoSubida> {
  const form = new FormData();
  for (const [clave, valor] of Object.entries(firma.campos)) form.append(clave, String(valor));
  form.append('file', await archivoParaFormData(imagen), imagen.nombre);

  return new Promise((resolver) => {
    const pedido = new XMLHttpRequest();
    pedido.open('POST', firma.urlSubida);
    pedido.timeout = ESPERA_MAXIMA_SUBIDA_MS;

    pedido.upload.onprogress = (evento) => {
      if (evento.lengthComputable && evento.total > 0) alAvanzar?.(evento.loaded / evento.total);
    };
    pedido.onload = () => {
      const leido = respuestaSubidaSchema.safeParse(leerJson(pedido.responseText));
      const aceptada = pedido.status >= 200 && pedido.status < 300 && leido.success;
      resolver(aceptada ? { tipo: 'ok', version: leido.data.version } : { tipo: 'rechazada' });
    };
    pedido.onerror = () => resolver({ tipo: 'sinConexion' });
    pedido.ontimeout = () => resolver({ tipo: 'sinConexion' });

    pedido.send(form);
  });
}
