import { Redirect } from 'expo-router';

import { useSesion } from '../hooks';
import { INICIO_POR_ROL, RUTA_LOGIN } from '../rutas';

/**
 * La raiz (`/`). No dibuja nada: solo decide a donde va la persona.
 *
 * Existe porque la home de un administrador y la de un super admin son
 * pantallas distintas, y la URL de entrada tiene que ser una sola (es la que
 * queda en el historial del navegador y la que abre un deep link sin ruta).
 */
export function EntradaScreen() {
  const { usuario } = useSesion();

  if (!usuario) return <Redirect href={RUTA_LOGIN} />;

  return <Redirect href={INICIO_POR_ROL[usuario.rol]} />;
}
