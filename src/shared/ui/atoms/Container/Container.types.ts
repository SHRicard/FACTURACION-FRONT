import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { MaxWidth } from '@/theme';

export interface ContainerProps {
  children: ReactNode;
  /**
   * Que tipo de contenido lleva adentro. De eso sale el ancho maximo:
   * - `formulario` → tope 440. Un input de 1300px no se puede leer.
   * - `contenido`  → tope 760. Ancho comodo para texto y fichas.
   * - `ancho`      → listados, tablas y dashboards: usan el 90% real.
   * - `completo`   → de borde a borde, sin margenes.
   */
  ancho?: MaxWidth;
  style?: StyleProp<ViewStyle>;
}
