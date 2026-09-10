import { Stack } from 'expo-router';

/**
 * Stack DENTRO del tab "Mas".
 *
 * Va anidado (y no en la raiz) a proposito: asi perfil y configuracion se abren
 * con la barra de tabs a la vista y, al volver al tab, se vuelve a donde se
 * habia quedado en vez de reiniciar el menu.
 */

/**
 * El menu es la BASE del stack: si se entra a una pantalla de Mas desde otro
 * tab (con `withAnchor`), el menu queda debajo y el tab nunca se traba en una
 * pantalla suelta. Ver el layout de Facturas.
 */
export const unstable_settings = { anchor: 'index' };

export default function CuentaLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
