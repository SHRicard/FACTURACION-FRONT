import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { useSesion } from '../hooks';
import { INICIO_POR_ROL, RUTA_LOGIN } from '../rutas';
import type { Rol } from '../types';

interface RutaProtegidaProps {
  /** Roles que pueden ver este subarbol. */
  roles: readonly Rol[];
  children: ReactNode;
}

/**
 * Porton de un area de la app. Envuelve el layout de la seccion.
 *
 * Sin sesion manda a login; con una sesion que no corresponde, al area que SI
 * le toca a ese rol (en vez de un "no tenes permiso" que deja a la persona en
 * un callejon sin salida).
 *
 * No espera nada: para cuando se monta, `ArranqueSesion` ya resolvio si el
 * token guardado seguia valiendo. Si redirigiera antes de eso, cualquier
 * recarga con sesion valida rebotaria a login por un instante.
 */
export function RutaProtegida({ roles, children }: RutaProtegidaProps) {
  const { usuario } = useSesion();

  if (!usuario) return <Redirect href={RUTA_LOGIN} />;
  if (!roles.includes(usuario.rol)) return <Redirect href={INICIO_POR_ROL[usuario.rol]} />;

  return <>{children}</>;
}
