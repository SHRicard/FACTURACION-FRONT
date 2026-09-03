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
}
