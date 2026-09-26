import { useAbrirAvisos, useRegistrarDispositivo } from '../hooks';

/**
 * Monta lo de las notificaciones que vive en la raiz: registrar el telefono y
 * abrir lo que se toca. No dibuja nada.
 *
 * Es un componente y no dos hooks sueltos en el layout porque tiene que quedar
 * DENTRO del navegador (abre pantallas) y despues de verificar la sesion.
 */
export function NotificacionesRaiz() {
  useRegistrarDispositivo();
  useAbrirAvisos();
  return null;
}
