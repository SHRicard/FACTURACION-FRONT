import { Stack } from 'expo-router';

/**
 * Stack DENTRO del tab de Facturacion.
 *
 * Anidado y no en la raiz: asi el detalle se abre con la barra de tabs a la
 * vista, y al volver al tab se vuelve al listado donde estaba (con su busqueda
 * y su scroll) en vez de arrancar de cero.
 */

/**
 * La lista es la BASE del stack. Cuando se entra a una factura desde otro tab
 * (la ficha del cliente, con `withAnchor`), la lista queda debajo. Sin esto el
 * tab arranca con la factura sola: "atras" no tiene a donde volver y cae en el
 * Dashboard, y `popToTopOnBlur` deja el tab trabado en esa factura.
 */
export const unstable_settings = { anchor: 'index' };

export default function FacturasLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
