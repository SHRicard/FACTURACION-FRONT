import { Stack } from 'expo-router';

/**
 * Stack DENTRO del tab de Clientes.
 *
 * Anidado y no en la raiz: asi el detalle y el formulario se abren con la barra
 * de tabs a la vista, y al volver al tab se vuelve al listado donde estaba (con
 * su busqueda y su scroll) en vez de arrancar de cero.
 */
export default function ClientesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
