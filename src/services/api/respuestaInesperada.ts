import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

/** Código del front para una respuesta que llegó pero no pasó el schema. */
export const CODIGO_RESPUESTA_INESPERADA = 'RESPUESTA_INESPERADA';

/**
 * El `catchSchemaFailure` de las mutaciones que mueven plata.
 *
 * Si la respuesta no pasa el schema, el servidor YA guardó el ticket o el
 * pago. Con un error sin manejar (lo que pasaba con `transformResponse` +
 * `.parse`), RTK Query no invalida ningún tag (rtk-query.modern.mjs:1100) y la
 * ficha seguiría mostrando la deuda vieja: la persona lo cargaría de nuevo.
 * Devolverlo como error manejado (rejectWithValue) hace que los tags se
 * invaliden igual, y `interpretarError` lo traduce a "revisá la cuenta".
 */
export function respuestaInesperada(): FetchBaseQueryError {
  return {
    status: 'CUSTOM_ERROR',
    error: CODIGO_RESPUESTA_INESPERADA,
    data: { codigo: CODIGO_RESPUESTA_INESPERADA },
  };
}

/** Para los `invalidatesTags`: sin resultado, pero el servidor sí guardó. */
export function esRespuestaInesperada(error: FetchBaseQueryError | undefined): boolean {
  return error?.status === 'CUSTOM_ERROR' && error.error === CODIGO_RESPUESTA_INESPERADA;
}
