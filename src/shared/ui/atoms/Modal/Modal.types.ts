import type { ReactNode } from 'react';

export interface ModalProps {
  visible: boolean;
  /** Se llama al cerrar: boton X, toque en el fondo o boton atras de Android. */
  onClose: () => void;
  titulo?: string;
  descripcion?: string;
  /** Contenido libre del modal. */
  children?: ReactNode;
  /** Botones de accion, abajo de todo. */
  acciones?: ReactNode;
  /** Tocar el fondo oscurecido cierra el modal. */
  cerrarAlTocarFondo?: boolean;
  /** Muestra la X arriba a la derecha. */
  mostrarCerrar?: boolean;
}
