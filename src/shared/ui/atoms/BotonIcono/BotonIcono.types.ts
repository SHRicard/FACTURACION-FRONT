import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface BotonIconoProps {
  /** El icono. Se le pasa el color desde afuera: el boton no lo decide. */
  children: ReactNode;
  onPress: () => void;
  /** Obligatorio: sin texto visible, es lo unico que lee el lector de pantalla. */
  accessibilityLabel: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}
