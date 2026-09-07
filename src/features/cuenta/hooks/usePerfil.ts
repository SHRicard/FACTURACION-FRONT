import { useSesion, useRefrescarSesion } from '@/features/auth/hooks';

/**
 * Los datos de la cuenta que se muestran, y como traerlos al dia.
 *
 * El usuario sale del store (lo puso el arranque), pero el `refrescar` va al
 * servidor de verdad: es la unica pantalla de la app donde tirar para abajo hoy
 * trae algo nuevo, porque `/auth/me` es el unico endpoint que tenemos.
 */
export function usePerfil() {
  const { usuario } = useSesion();
  const refrescar = useRefrescarSesion();

  return { usuario, refrescar };
}
