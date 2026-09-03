import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

type ErrorRtk = FetchBaseQueryError | SerializedError | undefined;

/** El backend devuelve `{ mensaje }` en los errores. */
function mensajeDelCuerpo(data: unknown): string | null {
  if (typeof data === 'string' && data.trim() !== '') return data;
  if (data && typeof data === 'object' && 'mensaje' in data) {
    const { mensaje } = data as { mensaje: unknown };
    if (typeof mensaje === 'string' && mensaje.trim() !== '') return mensaje;
  }
  return null;
}

/**
 * Convierte el error de RTK Query en un mensaje que se le puede mostrar a una
 * persona. Devuelve null si no hubo error.
 *
 * Existe para que ninguna pantalla tenga que hacer `('status' in error)` ni
 * mostrar un JSON crudo cuando algo falla.
 */
export function mensajeDeError(error: ErrorRtk): string | null {
  if (!error) return null;

  if ('status' in error) {
    switch (error.status) {
      case 'FETCH_ERROR':
        return 'No pudimos conectarnos con el servidor. Revisa tu conexion.';
      case 'TIMEOUT_ERROR':
        return 'El servidor tardo demasiado en responder. Proba de nuevo.';
      case 'PARSING_ERROR':
        return 'El servidor respondio algo que no entendimos.';
      case 'CUSTOM_ERROR':
        return mensajeDelCuerpo(error.data) ?? 'Ocurrio un error inesperado.';
      default:
        break;
    }

    // A esta altura `status` es un codigo HTTP.
    const delCuerpo = mensajeDelCuerpo((error as { data?: unknown }).data);
    if (delCuerpo) return delCuerpo;

    if (error.status === 401) return 'Email o contrasena incorrectos.';
    if (error.status === 409) return 'Ese email ya esta registrado.';
    if (typeof error.status === 'number' && error.status >= 500) {
      return 'El servidor tuvo un problema. Proba de nuevo en un rato.';
    }
    return 'No pudimos completar la operacion.';
  }

  // SerializedError: incluye lo que tire Zod al validar la respuesta.
  return error.message ?? 'Ocurrio un error inesperado.';
}
