/**
 * Corregir un ticket desde la cuenta del periodo. Misma pantalla que
 * `/admin/clientes/:id/tickets/:ticketId`, pero dentro del stack de Facturas
 * para que "atras" vuelva a la factura. Aca `id` es la FACTURA; el cliente viaja
 * como `clienteId`.
 */
export { TicketFormScreen as default } from '@/features/tickets/screens';
