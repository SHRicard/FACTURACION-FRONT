import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { API_BASE_URL, VERSION_APP } from '@/config';
import { headersDeApp, headersDeSesion } from '@/services/api';

/**
 * Reporte de errores del cliente a `POST /app/errores` (K12), sin librerías:
 * los errores de render (el ErrorBoundary del layout raíz) y los errores JS
 * que llegan al handler global (`instalarReporteGlobal`).
 *
 * Va con `fetch` directo y no con RTK Query a propósito: si lo que se rompió
 * es el store, el reporte tiene que poder salir igual.
 *
 * Nunca se manda el email ni el nombre de la persona, el estado de Redux ni
 * datos de clientes: solo el error, dónde pasó y en qué app y teléfono. El
 * token viaja en `Authorization` para que el back asocie el usuario; si ya no
 * sirve, el back lo ignora sin responder 401.
 */

/** La última pantalla visitada. La guarda el layout raíz con `recordarRuta`. */
let rutaActual: string | null = null;

/**
 * Lo que ya se mandó en esta sesión, por `nombre:mensaje`. Un error que se
 * repite en cada render o en cada tick no aporta nada nuevo después del
 * primero y solo gasta el rate limit del back (20 cada 15 min por IP).
 */
const yaReportados = new Set<string>();
let enviados = 0;

/**
 * Tope por sesión de la app. Si algo entra en loop con mensajes distintos
 * (un id en el texto, por ejemplo), la deduplicación no lo frena: esto sí.
 */
const MAXIMO_POR_SESION = 10;

/** Sin tope, un reporte con mala señal queda colgado para siempre. */
const ESPERA_MS = 5_000;

/**
 * Cuánto se demora el handler anterior ante un error fatal. Ese handler cierra
 * la app, y con ella se corta el pedido: esto le da tiempo a salir.
 */
const ESPERA_FATAL_MS = 2_000;

let reporteGlobalInstalado = false;

/** Guarda la pantalla actual para los errores que no pasan por el render. */
export function recordarRuta(ruta: string): void {
  rutaActual = ruta;
}

/** Recorta al largo que acepta el back. Vacío o sin valor → undefined. */
function cortar(texto: string | null | undefined, largo: number): string | undefined {
  if (!texto) return undefined;
  return texto.length > largo ? texto.slice(0, largo) : texto;
}

/**
 * Lo que se tiró, como Error. Si se tiró un string se usa de mensaje; no se
 * crea un `new Error` para no mandar un stack que apunta a este archivo.
 */
function normalizar(error: unknown): Pick<Error, 'name' | 'message' | 'stack'> {
  if (error instanceof Error) return error;
  return {
    name: 'Error',
    message: typeof error === 'string' ? error : String(error),
    stack: undefined,
  };
}

/**
 * Manda el error al back. Silencioso ante cualquier fallo: reportar un error
 * nunca puede tirar otro.
 */
export async function reportarError(
  error: unknown,
  extra: { fatal: boolean; ruta?: string | null; componentStack?: string | null },
): Promise<void> {
  try {
    const e = normalizar(error);
    const mensaje = cortar(e.message, 500) || 'Error sin mensaje';
    const nombre = cortar(e.name, 100);

    const clave = `${nombre}:${mensaje}`;
    if (yaReportados.has(clave) || enviados >= MAXIMO_POR_SESION) return;
    yaReportados.add(clave);
    enviados += 1;

    const cuerpo = {
      mensaje,
      nombre,
      stack: cortar(e.stack, 8000),
      componentStack: cortar(extra.componentStack, 4000),
      // Sin la query: ahí pueden viajar ids o un token de reseteo.
      ruta: cortar((extra.ruta ?? rutaActual)?.split('?')[0], 200),
      fatal: extra.fatal,
      version: cortar(VERSION_APP ?? 'desconocida', 20),
      plataforma: Platform.OS === 'android' || Platform.OS === 'ios' ? Platform.OS : 'web',
      versionSO: cortar(String(Platform.Version), 40),
      dispositivo: cortar(Device.modelName, 80),
      ocurridoEn: new Date().toISOString(),
    };

    const controlador = new AbortController();
    const corte = setTimeout(() => controlador.abort(), ESPERA_MS);
    try {
      await fetch(`${API_BASE_URL}/app/errores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headersDeApp(), ...headersDeSesion() },
        body: JSON.stringify(cuerpo),
        signal: controlador.signal,
      });
    } finally {
      clearTimeout(corte);
    }
  } catch {
    // Sin red, sin back o con el storage roto: el reporte se pierde y listo.
  }
}

/**
 * Engancha el handler global de errores JS de React Native: lo que revienta
 * fuera del render (un `onPress`, un timer) también se reporta.
 *
 * Idempotente: el layout raíz lo llama al cargarse, y con Fast Refresh eso
 * puede pasar más de una vez. En web no existe `ErrorUtils` y no hace nada.
 */
export function instalarReporteGlobal(): void {
  if (reporteGlobalInstalado || typeof ErrorUtils === 'undefined') return;
  reporteGlobalInstalado = true;

  const anterior = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    const reporte = reportarError(error, { fatal: isFatal === true });

    if (!isFatal) {
      anterior(error, isFatal);
      return;
    }

    // El anterior cierra la app (o muestra la pantalla roja en desarrollo):
    // se lo demora hasta que el reporte sale, con un máximo de 2 s.
    void Promise.race([
      reporte,
      new Promise<void>((resolver) => setTimeout(resolver, ESPERA_FATAL_MS)),
    ]).finally(() => anterior(error, isFatal));
  });
}
