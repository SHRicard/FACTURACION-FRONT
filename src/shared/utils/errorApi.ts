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
 * Regla del cuerpo de error (K11): los mensajes POR CAMPO viven solo en
 * `detalles.campos` (`{ dni: 'El DNI tiene que tener 7 u 8 números' }`) y van
 * debajo del input que corresponde, no en el cartel general. Todo lo demás de
 * `detalles` son datos para la pantalla (la deuda, los usos de una especie,
 * los pagos a anular), no mensajes: por eso van aparte, en `datos`.
 */
export type ErrorApi = {
  /** Mensaje listo para mostrarle a una persona. */
  mensaje: string;
  /** Codigo HTTP, o null si la request ni salio (sin red, servidor apagado). */
  status: number | null;
  /**
   * Código estable para decidir sin leer mensajes: el que manda el back
   * (`SALDO_NEGATIVO`, `IDEMPOTENCIA_CONFLICTO`…) o uno del front para los
   * errores sin respuesta (`FETCH_ERROR`, `TIMEOUT_ERROR`, `PARSING_ERROR`,
   * `RESPUESTA_INESPERADA`).
   */
  codigo: string | null;
  /** Mensajes por campo. La clave es la ruta de React Hook Form (`items.0.precioUnitario`). */
  campos: Record<string, string> | null;
  /** El resto de `detalles`, sin `campos`: datos estructurados, no mensajes. */
  datos: Record<string, unknown> | null;
  /** Segundos a esperar. Solo en un 429, del header `Retry-After`. */
  reintentarEn: number | null;
};

/**
 * Cuando la respuesta llegó pero no tiene la forma que esperamos, el servidor
 * ya pudo haber guardado. Por eso no se dice "falló": se pide mirar la cuenta
 * antes de reintentar.
 */
const MENSAJE_RESPUESTA_INESPERADA =
  'El servidor respondió algo inesperado. Revisá la cuenta antes de volver a intentar.';

/**
 * El backend responde los errores como `{ error, codigo?, detalles?, stack? }`
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

/** Un objeto plano (no array): la forma de `detalles` y de `detalles.campos`. */
function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/** El `detalles` del cuerpo, si es un objeto. */
function detallesDe(data: unknown): Record<string, unknown> | null {
  if (!esObjeto(data)) return null;
  const { detalles } = data;
  return esObjeto(detalles) ? detalles : null;
}

/**
 * Los mensajes por campo: SOLO `detalles.campos`, y de ahí solo los pares
 * ruta → motivo que sean texto. Un dato suelto de `detalles` (la deuda, los
 * métodos válidos) nunca se confunde con el error de un input.
 */
function camposDelCuerpo(data: unknown): Record<string, string> | null {
  const campos = detallesDe(data)?.campos;
  if (!esObjeto(campos)) return null;

  const limpios = Object.entries(campos).filter(
    (par): par is [string, string] => typeof par[1] === 'string',
  );
  return limpios.length > 0 ? Object.fromEntries(limpios) : null;
}

/** El resto de `detalles` sin `campos`: los datos que la pantalla puede usar. */
function datosDelCuerpo(data: unknown): Record<string, unknown> | null {
  const detalles = detallesDe(data);
  if (!detalles) return null;

  const datos = Object.fromEntries(
    Object.entries(detalles).filter(([clave]) => clave !== 'campos'),
  );
  return Object.keys(datos).length > 0 ? datos : null;
}

/** El `codigo` estable del back, si vino. */
function codigoDelCuerpo(data: unknown): string | null {
  if (!esObjeto(data)) return null;
  const { codigo } = data;
  return typeof codigo === 'string' && codigo.trim() !== '' ? codigo : null;
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
      codigo: null,
      campos: null,
      datos: null,
      reintentarEn: null,
    };
  }

  if ('status' in error) {
    switch (error.status) {
      case 'FETCH_ERROR':
        return {
          mensaje: 'No pudimos conectarnos con el servidor. Revisa tu conexion.',
          status: null,
          codigo: 'FETCH_ERROR',
          campos: null,
          datos: null,
          reintentarEn: null,
        };
      case 'TIMEOUT_ERROR':
        return {
          mensaje: 'El servidor tardo demasiado en responder. Proba de nuevo.',
          status: null,
          codigo: 'TIMEOUT_ERROR',
          campos: null,
          datos: null,
          reintentarEn: null,
        };
      case 'PARSING_ERROR':
        return {
          mensaje: 'El servidor respondio algo que no entendimos.',
          status: null,
          codigo: 'PARSING_ERROR',
          campos: null,
          datos: null,
          reintentarEn: null,
        };
      case 'CUSTOM_ERROR': {
        // Incluye el de `catchSchemaFailure` en las mutaciones de plata: la
        // respuesta llegó (y se guardó) pero no pasó el schema.
        const codigo = codigoDelCuerpo(error.data);
        return {
          mensaje:
            codigo === 'RESPUESTA_INESPERADA'
              ? MENSAJE_RESPUESTA_INESPERADA
              : (mensajeDelCuerpo(error.data) ?? 'Ocurrio un error inesperado.'),
          status: null,
          codigo,
          campos: null,
          datos: null,
          reintentarEn: null,
        };
      }
      default:
        break;
    }

    // A esta altura `status` es un codigo HTTP.
    const status = typeof error.status === 'number' ? error.status : null;
    const { data } = error as { data?: unknown };
    const reintentarEn = reintentarDelCuerpo(data);
    const delCuerpo = mensajeDelCuerpo(data);

    // El backend ya manda un mensaje pensado para mostrar; el nuestro es el
    // plan B para cuando no llega ninguno.
    let mensaje = delCuerpo;
    if (!mensaje) {
      if (status === 401) mensaje = 'Email o contraseña incorrectos.';
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

    return {
      mensaje,
      status,
      codigo: codigoDelCuerpo(data),
      campos: camposDelCuerpo(data),
      datos: datosDelCuerpo(data),
      reintentarEn,
    };
  }

  // SerializedError. Si es un ZodError, la respuesta no tuvo la forma
  // esperada: su `message` es el JSON de los issues y no se le muestra a nadie.
  const { name, message } = error as SerializedError;
  if (name === 'ZodError' || name === '$ZodError') {
    return {
      mensaje: MENSAJE_RESPUESTA_INESPERADA,
      status: null,
      codigo: 'RESPUESTA_INESPERADA',
      campos: null,
      datos: null,
      reintentarEn: null,
    };
  }
  return {
    mensaje: message ?? 'Ocurrio un error inesperado.',
    status: null,
    codigo: null,
    campos: null,
    datos: null,
    reintentarEn: null,
  };
}

/** Atajo para cuando la pantalla solo necesita el texto. */
export function mensajeDeError(error: ErrorRtk | unknown): string | null {
  return interpretarError(error)?.mensaje ?? null;
}

/**
 * La request pudo haber llegado y guardado aunque no tengamos la respuesta:
 * sin red a mitad de camino, el tope de tiempo, o un proxy que devolvió HTML.
 * En tickets y pagos el reintento con la misma clave de idempotencia no
 * duplica, así que el hook puede decir "tocá de nuevo" sin miedo.
 */
export function quedoEnDuda(error: ErrorApi | null): boolean {
  return (
    error?.codigo === 'FETCH_ERROR' ||
    error?.codigo === 'TIMEOUT_ERROR' ||
    error?.codigo === 'PARSING_ERROR'
  );
}
