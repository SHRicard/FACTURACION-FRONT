import { Stack } from 'expo-router';

/**
 * Stack DENTRO del tab de Clientes.
 *
 * Anidado y no en la raiz: asi el detalle y el formulario se abren con la barra
 * de tabs a la vista, y al volver al tab se vuelve al listado donde estaba (con
 * su busqueda y su scroll) en vez de arrancar de cero.
 */

/**
 * La lista es la BASE del stack: si se entra a una pantalla de Clientes desde
 * otro tab (con `withAnchor`), la lista queda debajo y el tab nunca se traba en
 * un detalle suelto. Ver el layout de Facturas.
 */
export const unstable_settings = { anchor: 'index' };

export default function ClientesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
