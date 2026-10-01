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
  /**
   * Apila las acciones a lo ancho en vez de alinearlas a la derecha. Es lo que
   * quiere un dialogo con una accion principal clara en un telefono; la fila
   * sigue siendo el default para los de confirmar/descartar.
   */
  accionesApiladas?: boolean;
  /** Tocar el fondo oscurecido cierra el modal. */
  cerrarAlTocarFondo?: boolean;
  /** Muestra la X arriba a la derecha. */
  mostrarCerrar?: boolean;
}
