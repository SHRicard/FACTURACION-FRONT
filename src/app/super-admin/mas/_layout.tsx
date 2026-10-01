import { Stack } from 'expo-router';

/**
 * Stack DENTRO del tab de Más: el detalle se abre con la barra de tabs a la
 * vista. La base del stack es la pantalla del tab: si se entra desde otro tab
 * (con `withAnchor`), queda debajo y el tab nunca se traba en un detalle suelto.
 */
export const unstable_settings = { anchor: 'index' };

export default function MasLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
