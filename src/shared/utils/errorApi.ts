import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

/**
 * Lo que puede llegar aca: el `error` de un hook de RTK Query, o lo que tira
 * `unwrap()` dentro de un catch (que TypeScript tipa como `unknown`).
 */
type ErrorRtk = FetchBaseQueryError | SerializedError | undefined;

/** Un error de RTK Query siempre trae `status` o `message`. */
function esErrorRtk(valor: unknown): valor is FetchBaseQueryError | SerializedError {
  return typeof valor === 'object' && valor !== null && ('status' in valor || 'message' in valor);
}

/**
 * Error de la API ya masticado para la UI.
 *
 * `detalles` son los errores POR CAMPO que manda el backend en los 400
 * (`{ nombre: "Path 'nombre' is required." }`): van debajo del input que
 * corresponde, no en el cartel general.
 */
export type ErrorApi = {
  /** Mensaje listo para mostrarle a una persona. */
  mensaje: string;
  /** Codigo HTTP, o null si la request ni salio (sin red, servidor apagado). */
  status: number | null;
  /** Errores por campo, cuando el backend los manda. */
  detalles: Record<string, string> | null;
  /** Segundos a esperar. Solo en un 429, del header `Retry-After`. */
  reintentarEn: number | null;
};

/**
 * El backend responde los errores como `{ error, detalles?, stack? }`
 * (ver `middleware/errorHandler.ts`). El `stack` solo llega en 500 fuera de
 * produccion y se ignora a proposito.
 */
function mensajeDelCuerpo(data: unknown): string | null {
  if (typeof data === 'string' && data.trim() !== '') return data;
  if (data && typeof data === 'object' && 'error' in data) {
    const { error } = data as { error: unknown };
    if (typeof error === 'string' && error.trim() !== '') return error;
  }
  return null;
}

/** Solo nos quedamos con los pares campo → motivo que sean texto. */
function detallesDelCuerpo(data: unknown): Record<string, string> | null {
  if (!data || typeof data !== 'object' || !('detalles' in data)) return null;

  const { detalles } = data as { detalles: unknown };
  if (!detalles || typeof detalles !== 'object' || Array.isArray(detalles)) return null;

  const limpios = Object.entries(detalles).filter(
    (par): par is [string, string] => typeof par[1] === 'string',
  );
  return limpios.length > 0 ? Object.fromEntries(limpios) : null;
}

/** Lo inyecta el baseQuery leyendo el header `Retry-After` de la respuesta. */
function reintentarDelCuerpo(data: unknown): number | null {
  if (!data || typeof data !== 'object' || !('reintentarEn' in data)) return null;
  const { reintentarEn } = data as { reintentarEn: unknown };
  return typeof reintentarEn === 'number' && Number.isFinite(reintentarEn) ? reintentarEn : null;
}

/** "en 15 minutos", "en 45 segundos". Para el mensaje del 429. */
function enCuantoTiempo(segundos: number): string {
  if (segundos < 60) return `en ${segundos} segundo${segundos === 1 ? '' : 's'}`;
  const minutos = Math.ceil(segundos / 60);
  return `en ${minutos} minuto${minutos === 1 ? '' : 's'}`;
}

/**
 * Convierte el error de RTK Query en algo que se le puede mostrar a una persona.
 * Devuelve null si no hubo error.
 *
 * Existe para que ninguna pantalla tenga que hacer `('status' in error)` ni
 * mostrar un JSON crudo cuando algo falla.
 */
export function interpretarError(error: ErrorRtk | unknown): ErrorApi | null {
  if (!error) return null;
  if (!esErrorRtk(error)) {
    return {
      mensaje: 'Ocurrio un error inesperado.',
      status: null,
      detalles: null,
      reintentarEn: null,
    };
  }

  if ('status' in error) {
    switch (error.status) {
      case 'FETCH_ERROR':
        return {
          mensaje: 'No pudimos conectarnos con el servidor. Revisa tu conexion.',
          status: null,
          detalles: null,
          reintentarEn: null,
        };
      case 'TIMEOUT_ERROR':
        return {
          mensaje: 'El servidor tardo demasiado en responder. Proba de nuevo.',
          status: null,
          detalles: null,
          reintentarEn: null,
        };
      case 'PARSING_ERROR':
        return {
          mensaje: 'El servidor respondio algo que no entendimos.',
          status: null,
          detalles: null,
          reintentarEn: null,
        };
      case 'CUSTOM_ERROR':
        return {
          mensaje: mensajeDelCuerpo(error.data) ?? 'Ocurrio un error inesperado.',
          status: null,
          detalles: null,
          reintentarEn: null,
        };
      default:
        break;
    }

    // A esta altura `status` es un codigo HTTP.
    const status = typeof error.status === 'number' ? error.status : null;
    const { data } = error as { data?: unknown };
    const detalles = detallesDelCuerpo(data);
    const reintentarEn = reintentarDelCuerpo(data);
    const delCuerpo = mensajeDelCuerpo(data);

    // El backend ya manda un mensaje pensado para mostrar; el nuestro es el
    // plan B para cuando no llega ninguno.
    let mensaje = delCuerpo;
    if (!mensaje) {
      if (status === 401) mensaje = 'Email o contrasena incorrectos.';
      else if (status === 403) mensaje = 'No tenes permiso para hacer esto.';
      else if (status === 404) mensaje = 'No encontramos lo que buscabas.';
      else if (status === 409) mensaje = 'Ese email ya esta registrado.';
      else if (status === 429) mensaje = 'Hiciste demasiados intentos.';
      else if (status !== null && status >= 500) {
        mensaje = 'El servidor tuvo un problema. Proba de nuevo en un rato.';
      } else mensaje = 'No pudimos completar la operacion.';
    }

    // El 429 sin el "cuando" obliga a reintentar a ciegas. Solo lo agregamos si
    // el mensaje es el nuestro: el del backend ya dice cuanto hay que esperar
    // ("Demasiados intentos. Proba de nuevo en 10 minutos.") y repetirlo queda
    // como un tartamudeo.
    if (status === 429 && reintentarEn !== null && !delCuerpo) {
      mensaje = `${mensaje} Proba de nuevo ${enCuantoTiempo(reintentarEn)}.`;
    }

    return { mensaje, status, detalles, reintentarEn };
  }

  // SerializedError: incluye lo que tire Zod al validar la respuesta.
  return {
    mensaje: (error as SerializedError).message ?? 'Ocurrio un error inesperado.',
    status: null,
    detalles: null,
    reintentarEn: null,
  };
}

/** Atajo para cuando la pantalla solo necesita el texto. */
export function mensajeDeError(error: ErrorRtk | unknown): string | null {
  return interpretarError(error)?.mensaje ?? null;
}
