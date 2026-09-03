import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { MaxWidth } from '@/theme';

export interface ContainerProps {
  children: ReactNode;
  /**
   * Que tipo de contenido lleva adentro. De eso sale el ancho maximo:
   * - `formulario` → una columna angosta (login, alta de factura)
   * - `contenido`  → texto y fichas
   * - `ancho`      → listados y dashboards, que si aprovechan la pantalla
   * - `completo`   → sin limite
   */
  ancho?: MaxWidth;
  /** Padding horizontal que crece con la ventana. */
  conPadding?: boolean;
  style?: StyleProp<ViewStyle>;
}
