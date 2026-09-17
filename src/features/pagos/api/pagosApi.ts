import { baseApi } from '@/services/api';

import { respuestaAnulacionPagoSchema, respuestaPagoSchema } from '../schemas';
import type { PagoNuevo, RespuestaAnulacionPago, RespuestaPago } from '../types';

/**
 * Endpoints de pagos: las dos puertas para registrar y la anulacion.
 *
 * Los tres invalidan lo mismo: el cliente (su deuda cambio), los listados, y
 * cada factura que toco la plata. Las facturas vienen recalculadas en la
 * respuesta, asi que no hay que volver a pedirlas a mano.
 */
export const pagosApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * "Dejo $X": va a la factura activa del cliente, que es la unica con deuda.
     * Es la puerta del mostrador, la que se usa casi siempre.
     */
    registrarPagoCliente: build.mutation<RespuestaPago, { clienteId: string; pago: PagoNuevo }>({
      query: ({ clienteId, pago }) => ({
        url: `/clientes/${encodeURIComponent(clienteId)}/pagos`,
        method: 'POST',
        body: pago,
      }),
      transformResponse: (respuesta: unknown) => respuestaPagoSchema.parse(respuesta),
      invalidatesTags: (resultado, _error, { clienteId }) => [
        { type: 'Cliente', id: clienteId },
        { type: 'Cliente', id: 'LISTA' },
        { type: 'Factura', id: 'LISTA' },
        { type: 'Factura', id: 'VENCIDAS' },
        ...(resultado?.facturas ?? []).map((factura) => ({
          type: 'Factura' as const,
          id: factura.id,
        })),
      ],
    }),

    /** "Esto es para esta factura": todo el monto va a esa. */
    registrarPagoFactura: build.mutation<
      RespuestaPago,
      { facturaId: string; clienteId: string; pago: PagoNuevo }
    >({
      query: ({ facturaId, pago }) => ({
        url: `/facturas/${encodeURIComponent(facturaId)}/pagos`,
        method: 'POST',
        body: pago,
      }),
      transformResponse: (respuesta: unknown) => respuestaPagoSchema.parse(respuesta),
      invalidatesTags: (_resultado, _error, { facturaId, clienteId }) => [
        { type: 'Cliente', id: clienteId },
        { type: 'Cliente', id: 'LISTA' },
        { type: 'Factura', id: facturaId },
        { type: 'Factura', id: 'LISTA' },
        { type: 'Factura', id: 'VENCIDAS' },
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
      transformResponse: (respuesta: unknown) => respuestaAnulacionPagoSchema.parse(respuesta),
      invalidatesTags: (resultado, _error, { clienteId }) => [
        ...(clienteId ? [{ type: 'Cliente' as const, id: clienteId }] : []),
        { type: 'Cliente', id: 'LISTA' },
        { type: 'Factura', id: 'LISTA' },
        { type: 'Factura', id: 'VENCIDAS' },
        ...(resultado?.facturas ?? []).map((factura) => ({
          type: 'Factura' as const,
          id: factura.id,
        })),
      ],
    }),
  }),
});

export const {
  useRegistrarPagoClienteMutation,
  useRegistrarPagoFacturaMutation,
  useAnularPagoMutation,
} = pagosApi;
