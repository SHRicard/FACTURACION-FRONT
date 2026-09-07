import { Stack } from 'expo-router';

/**
 * Stack DENTRO del tab "Mas".
 *
 * Va anidado (y no en la raiz) a proposito: asi perfil y configuracion se abren
 * con la barra de tabs a la vista y, al volver al tab, se vuelve a donde se
 * habia quedado en vez de reiniciar el menu.
 */
export default function CuentaLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
