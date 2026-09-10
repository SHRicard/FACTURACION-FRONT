/**
 * Cargar un ticket desde la cuenta del periodo. Es la misma pantalla que
 * `/admin/clientes/:id/ticket`, pero dentro del stack de Facturas: asi "atras"
 * vuelve a la factura en vez de saltar de tab. Aca `id` es la FACTURA; el
 * cliente viaja como `clienteId`.
 */
export { TicketFormScreen as default } from '@/features/tickets/screens';
