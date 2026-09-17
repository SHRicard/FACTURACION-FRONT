import type { ReactNode } from 'react';
import type { TextInputProps } from 'react-native';

export interface InputProps extends Omit<TextInputProps, 'style' | 'editable'> {
  /** Pinta el borde de error. El MENSAJE lo muestra InputField, no este atom. */
  hasError?: boolean;
  disabled?: boolean;
  /** Contenido a la izquierda del campo (ej. un icono). */
  leftSlot?: ReactNode;
  /** Contenido a la derecha del campo (ej. el ojo de mostrar contrasena). */
  rightSlot?: ReactNode;
  /**
   * Campo de plata: se ve `2.000.000` mientras se escribe, con el `$` adelante
   * y el teclado numerico. El `value` y el `onChangeText` siguen siendo SOLO
   * digitos (`'2000000'`): los puntos son de pantalla, el formulario no se
   * entera.
   */
  monto?: boolean;
}
