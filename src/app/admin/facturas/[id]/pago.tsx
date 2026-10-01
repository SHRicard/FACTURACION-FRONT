/**
 * Pago desde el detalle de una factura: todo el monto va a esa. Misma pantalla que
 * `/admin/clientes/:id/pago`, pero dentro del stack de Facturas para que "atras"
 * vuelva a la factura. Aca `id` es la FACTURA; el cliente viaja como `clienteId`.
 */
export { PagoFormScreen as default } from '@/features/pagos/screens';
