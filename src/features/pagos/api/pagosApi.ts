import { baseApi, esRespuestaInesperada, respuestaInesperada } from '@/services/api';

import { respuestaAnulacionPagoSchema, respuestaPagoSchema } from '../schemas';
import type { PagoNuevo, RespuestaAnulacionPago, RespuestaPago } from '../types';

/**
 * Endpoints de pagos: las dos puertas para registrar y la anulacion.
 *
 * Los tres invalidan lo mismo: el cliente (su deuda cambio), los listados, y
 * cada factura que toco la plata. Las facturas vienen recalculadas en la
 * respuesta, asi que no hay que volver a pedirlas a mano.
 *
 * También invalidan el Inicio y las métricas (`{Metrica,'TODAS'}`) y Mi marca:
 * "Plata en la calle" y "Cobraste este mes" cambian con cada pago, y el tab
 * Inicio no se desmonta al cambiar de tab.
 *
 * La respuesta se valida con `rawResponseSchema` y `catchSchemaFailure`: si no
 * pasa el schema, el pago YA se guardó, así que tiene que ser un error manejado
 * para que los tags se invaliden igual (ver `respuestaInesperada`).
 */
export const pagosApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * "Dejo $X": va a la factura activa del cliente, que es la unica con deuda.
     * Es la puerta del mostrador, la que se usa casi siempre.
     */
    registrarPagoCliente: build.mutation<
      RespuestaPago,
      { clienteId: string; pago: PagoNuevo; claveIdempotencia: string }
    >({
      query: ({ clienteId, pago, claveIdempotencia }) => ({
        url: `/clientes/${encodeURIComponent(clienteId)}/pagos`,
        method: 'POST',
        body: pago,
        // Una por intento de guardado: el reintento no registra el cobro dos
        // veces (K1).
        headers: { 'Idempotency-Key': claveIdempotencia },
      }),
      rawResponseSchema: respuestaPagoSchema,
      catchSchemaFailure: respuestaInesperada,
      invalidatesTags: (resultado, error, { clienteId }) => [
        { type: 'Cliente', id: clienteId },
        { type: 'Cliente', id: 'LISTA' },
        { type: 'Factura', id: 'LISTA' },
        { type: 'Factura', id: 'VENCIDAS' },
        ...(resultado?.facturas ?? []).map((factura) => ({
          type: 'Factura' as const,
          id: factura.id,
        })),
        // Sin respuesta legible no sabemos qué facturas tocó: todas.
        ...(!resultado && esRespuestaInesperada(error) ? ['Factura' as const] : []),
        { type: 'Metrica', id: 'TODAS' },
        'Marca',
      ],
    }),

    /** "Esto es para esta factura": todo el monto va a esa. */
    registrarPagoFactura: build.mutation<
      RespuestaPago,
      { facturaId: string; clienteId: string; pago: PagoNuevo; claveIdempotencia: string }
    >({
      query: ({ facturaId, pago, claveIdempotencia }) => ({
        url: `/facturas/${encodeURIComponent(facturaId)}/pagos`,
        method: 'POST',
        body: pago,
        headers: { 'Idempotency-Key': claveIdempotencia },
      }),
      rawResponseSchema: respuestaPagoSchema,
      catchSchemaFailure: respuestaInesperada,
      invalidatesTags: (_resultado, _error, { facturaId, clienteId }) => [
        { type: 'Cliente', id: clienteId },
        { type: 'Cliente', id: 'LISTA' },
        { type: 'Factura', id: facturaId },
        { type: 'Factura', id: 'LISTA' },
        { type: 'Factura', id: 'VENCIDAS' },
        { type: 'Metrica', id: 'TODAS' },
        'Marca',
      ],
    }),

    /**
     * Baja LOGICA de la entrega ENTERA, no solo de ese renglon: si se tipeo
     * $40.000 en vez de $4.000, esta mal en todas las facturas que toco. Se
     * puede anular aunque la factura este pagada: vuelve a `abierta` y a deber.
     * No hay desanular.
     */
    anularPago: build.mutation<
      RespuestaAnulacionPago,
      { id: string; clienteId?: string; motivo?: string }
    >({
      query: ({ id, motivo }) => ({
        url: `/pagos/${encodeURIComponent(id)}`,
        method: 'DELETE',
        ...(motivo ? { body: { motivo } } : {}),
      }),
      rawResponseSchema: respuestaAnulacionPagoSchema,
      catchSchemaFailure: respuestaInesperada,
      invalidatesTags: (resultado, error, { clienteId }) => [
        ...(clienteId ? [{ type: 'Cliente' as const, id: clienteId }] : []),
        { type: 'Cliente', id: 'LISTA' },
        { type: 'Factura', id: 'LISTA' },
        { type: 'Factura', id: 'VENCIDAS' },
        ...(resultado?.facturas ?? []).map((factura) => ({
          type: 'Factura' as const,
          id: factura.id,
        })),
        ...(!resultado && esRespuestaInesperada(error) ? ['Factura' as const] : []),
        { type: 'Metrica', id: 'TODAS' },
        'Marca',
      ],
    }),
  }),
});

export const {
  useRegistrarPagoClienteMutation,
  useRegistrarPagoFacturaMutation,
  useAnularPagoMutation,
} = pagosApi;
