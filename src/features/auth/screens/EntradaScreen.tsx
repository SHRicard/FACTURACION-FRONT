import { Redirect } from 'expo-router';

import { useSesion } from '../hooks';
import { INICIO_POR_ROL, RUTA_CUENTA_SUSPENDIDA, RUTA_LOGIN, RUTA_POR_PENDIENTE } from '../rutas';

/**
 * La raiz (`/`). No dibuja nada: solo decide a donde va la persona.
 *
 * Existe porque la home de un administrador y la de un super admin son
 * pantallas distintas, y la URL de entrada tiene que ser una sola (es la que
 * queda en el historial del navegador y la que abre un deep link sin ruta).
 */
export function EntradaScreen() {
  const { usuario, pendiente, suspension } = useSesion();

  // Sin sesion porque la suspendieron: el cartel que lo explica, no el login.
  if (!usuario) return <Redirect href={suspension ? RUTA_CUENTA_SUSPENDIDA : RUTA_LOGIN} />;
  // Sin DNI o sin marca no se opera: primero la bienvenida.
  if (pendiente) return <Redirect href={RUTA_POR_PENDIENTE[pendiente]} />;

  return <Redirect href={INICIO_POR_ROL[usuario.rol]} />;
}
