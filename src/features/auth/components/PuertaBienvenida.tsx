import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { useSesion } from '../hooks';
import { RUTA_LOGIN, RUTA_POR_PENDIENTE } from '../rutas';
import type { Pendiente } from '../types';

interface PuertaBienvenidaProps {
  /** Que paso de la bienvenida es esta pantalla. */
  paso: NonNullable<Pendiente>;
  children: ReactNode;
}

/**
 * Porton de cada paso de la bienvenida: deja ver la pantalla solo si es la que
 * le toca a la cuenta, y si no la manda a la que corresponde.
 *
 * Es lo que hace avanzar el flujo: al aceptar los terminos el pendiente pasa a
 * 'perfil', al cargar el DNI a 'marca', y al crear la marca a null, que lo deja
 * entrar a la app. Los hooks no navegan.
 *
 * Vive en `auth` y no en la feature de cada paso porque lo que decide es el
 * `pendiente` de la SESION, y ya lo usan dos features (los terminos y la marca).
 */
export function PuertaBienvenida({ paso, children }: PuertaBienvenidaProps) {
  const { usuario, pendiente } = useSesion();

  if (!usuario) return <Redirect href={RUTA_LOGIN} />;
  if (!pendiente) return <Redirect href="/" />;
  if (pendiente !== paso) return <Redirect href={RUTA_POR_PENDIENTE[pendiente]} />;

  return <>{children}</>;
}
