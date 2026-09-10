import { baseApi } from '@/services/api';

import { respuestaAnulacionSchema, respuestaTicketSchema, ticketSchema } from '../schemas';
import type { RespuestaAnulacion, RespuestaTicket, Ticket, TicketNuevo } from '../types';

/**
 * Endpoints del ticket: el ciclo completo.
 *
 * Los tres que escriben (alta, edicion y anulacion) invalidan el cliente: la
 * deuda que muestran el listado y la ficha acaba de cambiar. La factura viene
 * en la respuesta ya recalculada, asi que no hace falta volver a pedirla.
 */
export const ticketsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Carga un ticket en la factura abierta del cliente.
     *
     * El backend calcula los subtotales y el total, copia el nombre de la
     * especie adentro de cada item y devuelve la factura al dia. Ojo: esa
     * factura puede ser una NUEVA (ver `useGuardarTicket`).
     */
    crearTicket: build.mutation<RespuestaTicket, { clienteId: string; ticket: TicketNuevo }>({
      query: ({ clienteId, ticket }) => ({
        url: `/clientes/${encodeURIComponent(clienteId)}/tickets`,
        method: 'POST',
        body: ticket,
      }),
      transformResponse: (respuesta: unknown) => respuestaTicketSchema.parse(respuesta),
      invalidatesTags: (resultado, _error, { clienteId }) => [
        { type: 'Cliente', id: clienteId },
        { type: 'Cliente', id: 'LISTA' },
        // La factura que devuelve la respuesta: puede ser una nueva, si el
        // backend cerro el periodo vencido en este mismo request.
        ...(resultado ? [{ type: 'Factura' as const, id: resultado.factura.id }] : []),
        { type: 'Factura', id: 'LISTA' },
        { type: 'Factura', id: 'VENCIDAS' },
      ],
    }),

    /**
     * Un ticket suelto, sin su factura. Para abrirlo por link o para recargar
     * la pantalla de correccion.
     */
    ticketDetalle: build.query<Ticket, string>({
      query: (id) => ({ url: `/tickets/${encodeURIComponent(id)}` }),
      transformResponse: (respuesta: unknown) => ticketSchema.parse(respuesta),
      providesTags: (_resultado, _error, id) => [{ type: 'Ticket', id }],
    }),

    /**
     * Correccion. REEMPLAZA los renglones enteros, no los parchea de a uno: el
     * formulario ya tiene el ticket completo, asi que manda como quedo. Un
     * merge por indice haria que borrar el segundo renglon dependiera de mandar
     * bien los otros.
     *
     * Responde con la misma forma que el alta, asi que las dos pantallas
     * comparten el manejo de la respuesta.
     */
    editarTicket: build.mutation<
      RespuestaTicket,
      { id: string; clienteId: string; ticket: TicketNuevo }
    >({
      query: ({ id, ticket }) => ({
        url: `/tickets/${encodeURIComponent(id)}`,
        method: 'PUT',
        body: ticket,
      }),
      transformResponse: (respuesta: unknown) => respuestaTicketSchema.parse(respuesta),
      invalidatesTags: (resultado, _error, { id, clienteId }) => [
        { type: 'Ticket', id },
        { type: 'Cliente', id: clienteId },
        { type: 'Cliente', id: 'LISTA' },
        ...(resultado ? [{ type: 'Factura' as const, id: resultado.factura.id }] : []),
        { type: 'Factura', id: 'LISTA' },
        { type: 'Factura', id: 'VENCIDAS' },
      ],
    }),

    /**
     * Anulacion: baja LOGICA. El ticket no se borra, queda con `anulado: true`
     * y deja de sumar a la factura. No hay desanular: si se anulo por error, se
     * carga de nuevo.
     *
     * El motivo es opcional, pero es lo que explica meses despues por que la
     * cuenta cambio de un dia para el otro.
     */
    anularTicket: build.mutation<
      RespuestaAnulacion,
      { id: string; clienteId: string; motivo?: string }
    >({
      query: ({ id, motivo }) => ({
        url: `/tickets/${encodeURIComponent(id)}`,
        method: 'DELETE',
        ...(motivo ? { body: { motivo } } : {}),
      }),
      transformResponse: (respuesta: unknown) => respuestaAnulacionSchema.parse(respuesta),
      invalidatesTags: (resultado, _error, { id, clienteId }) => [
        { type: 'Ticket', id },
        { type: 'Cliente', id: clienteId },
        { type: 'Cliente', id: 'LISTA' },
        ...(resultado ? [{ type: 'Factura' as const, id: resultado.factura.id }] : []),
        { type: 'Factura', id: 'LISTA' },
        { type: 'Factura', id: 'VENCIDAS' },
      ],
    }),
  }),
});

export const {
  useCrearTicketMutation,
  useTicketDetalleQuery,
  useEditarTicketMutation,
  useAnularTicketMutation,
} = ticketsApi;
