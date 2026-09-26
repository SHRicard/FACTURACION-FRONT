import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { useSesion } from '../hooks';
import { INICIO_POR_ROL, RUTA_CUENTA_SUSPENDIDA, RUTA_LOGIN, RUTA_POR_PENDIENTE } from '../rutas';
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
  const { usuario, pendiente, suspension } = useSesion();

  // Sin sesion porque la suspendieron: el cartel que lo explica, no el login.
  if (!usuario) return <Redirect href={suspension ? RUTA_CUENTA_SUSPENDIDA : RUTA_LOGIN} />;
  /*
   * Le falta el DNI o la marca: todo lo de adentro responderia 403. Tambien
   * cubre el caso de a mitad de uso —otro dueno lo saco de la marca—, porque
   * el middleware de la sesion actualiza el pendiente con ese 403.
   */
  if (pendiente) return <Redirect href={RUTA_POR_PENDIENTE[pendiente]} />;
  if (!roles.includes(usuario.rol)) return <Redirect href={INICIO_POR_ROL[usuario.rol]} />;

  return <>{children}</>;
}
