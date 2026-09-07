import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { MaxWidth } from '@/theme';

export interface PantallaProps {
  /** Titulo grande del encabezado. Es el `header` para el lector de pantalla. */
  titulo: string;
  /** Bajada opcional debajo del titulo. */
  descripcion?: string;
  /**
   * Tope de ancho del contenido. Por defecto `ancho`, que es lo que quiere una
   * pantalla de tab (listados, dashboards). Un formulario pasa `formulario`.
   */
  ancho?: MaxWidth;
  /** Accion al costado del titulo (ej. un boton "Nueva factura"). */
  accion?: ReactNode;
  /**
   * Si se pasa, arriba del titulo aparece una `BarraVolver` con la flecha (y la
   * `accion`, si hay). Las pantallas de la app no usan el header nativo del
   * navegador, asi que el "atras" se dibuja aca.
   */
  onVolver?: () => void;
  /**
   * Texto al lado de la flecha, para decir a DONDE se vuelve ("Clientes").
   * Solo tiene efecto junto con `onVolver`.
   */
  labelVolver?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}
