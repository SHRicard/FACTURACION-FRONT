import { baseApi, esRespuestaInesperada, respuestaInesperada } from '@/services/api';

import { respuestaAnulacionSchema, respuestaTicketSchema, ticketSchema } from '../schemas';
import type { RespuestaAnulacion, RespuestaTicket, Ticket, TicketNuevo } from '../types';

/**
 * Endpoints del ticket: el ciclo completo.
 *
 * Los tres que escriben (alta, edicion y anulacion) invalidan el cliente: la
 * deuda que muestran el listado y la ficha acaba de cambiar. La factura viene
 * en la respuesta ya recalculada, asi que no hace falta volver a pedirla.
 *
 * También invalidan el Inicio y las métricas (`{Metrica,'TODAS'}`) y Mi marca
 * (sus estadísticas): cambian con cada ticket, y el tab Inicio no se desmonta
 * al cambiar de tab, así que sin esto queda con los números viejos. Y las
 * especies: el backend les descuenta la `cantidad` al cargar, y se la ajusta
 * al corregir o anular.
 *
 * La respuesta se valida con `rawResponseSchema` (antes de transformar) y no
 * con un `.parse` en `transformResponse`: así una falla de schema se vuelve un
 * error manejado (`respuestaInesperada`) y los tags se invalidan igual, porque
 * el servidor ya guardó. La salida del schema, ya con `id`, es la data.
 */
export const ticketsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Carga un ticket en la factura activa del cliente, aunque ya este vencida:
     * se suma a lo que debe.
     *
     * El backend calcula los subtotales y el total, copia el nombre de la
     * especie adentro de cada item y devuelve la factura al dia. Si es el
     * primer ticket, `venceEl` fija la fecha acordada.
     */
    crearTicket: build.mutation<
      RespuestaTicket,
      { clienteId: string; ticket: TicketNuevo; claveIdempotencia: string }
    >({
      query: ({ clienteId, ticket, claveIdempotencia }) => ({
        url: `/clientes/${encodeURIComponent(clienteId)}/tickets`,
        method: 'POST',
        body: ticket,
        // Una por intento de guardado: el reintento con la misma clave no
        // carga el ticket dos veces (K1).
        headers: { 'Idempotency-Key': claveIdempotencia },
      }),
      rawResponseSchema: respuestaTicketSchema,
      catchSchemaFailure: respuestaInesperada,
      invalidatesTags: (resultado, error, { clienteId }) => [
        { type: 'Cliente', id: clienteId },
        { type: 'Cliente', id: 'LISTA' },
        // La factura activa, con el ticket ya sumado. Puede ser una recien
        // abierta si la anterior se habia saldado. Si la respuesta no se pudo
        // leer, no sabemos cual fue: se invalidan todas.
        ...(resultado
          ? [{ type: 'Factura' as const, id: resultado.factura.id }]
          : esRespuestaInesperada(error)
            ? ['Factura' as const]
            : []),
        { type: 'Factura', id: 'LISTA' },
        { type: 'Factura', id: 'VENCIDAS' },
        { type: 'Metrica', id: 'TODAS' },
        'Marca',
        { type: 'Especie', id: 'LISTA' },
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
      rawResponseSchema: respuestaTicketSchema,
      catchSchemaFailure: respuestaInesperada,
      invalidatesTags: (resultado, error, { id, clienteId }) => [
        { type: 'Ticket', id },
        { type: 'Cliente', id: clienteId },
        { type: 'Cliente', id: 'LISTA' },
        ...(resultado
          ? [{ type: 'Factura' as const, id: resultado.factura.id }]
          : esRespuestaInesperada(error)
            ? ['Factura' as const]
            : []),
        { type: 'Factura', id: 'LISTA' },
        { type: 'Factura', id: 'VENCIDAS' },
        { type: 'Metrica', id: 'TODAS' },
        'Marca',
        { type: 'Especie', id: 'LISTA' },
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
      rawResponseSchema: respuestaAnulacionSchema,
      catchSchemaFailure: respuestaInesperada,
      invalidatesTags: (resultado, error, { id, clienteId }) => [
        { type: 'Ticket', id },
        { type: 'Cliente', id: clienteId },
        { type: 'Cliente', id: 'LISTA' },
        ...(resultado
          ? [{ type: 'Factura' as const, id: resultado.factura.id }]
          : esRespuestaInesperada(error)
            ? ['Factura' as const]
            : []),
        { type: 'Factura', id: 'LISTA' },
        { type: 'Factura', id: 'VENCIDAS' },
        { type: 'Metrica', id: 'TODAS' },
        'Marca',
        { type: 'Especie', id: 'LISTA' },
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
