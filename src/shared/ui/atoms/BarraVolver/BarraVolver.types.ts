import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface BarraVolverProps {
  /** Que hacer al tocar atras. Normalmente `router.back()`. */
  onVolver: () => void;
  /**
   * A DONDE se vuelve ("Clientes"). Solo se dibuja en el estilo de cabecera que
   * lo lleva; en los otros dos la barra queda con el chevron solo.
   */
  label?: string;
  /**
   * Titulo de la pantalla. Solo se dibuja en el estilo que mete el titulo
   * dentro de la barra; en los otros dos lo pone `Pantalla`, grande, debajo.
   */
  titulo?: string;
  /** Bajada del titulo. Mismo caso que `titulo`. */
  descripcion?: string;
  /** Accion de la pantalla, a la derecha. Un `BotonIcono`, normalmente. */
  accion?: ReactNode;
  /** Solo si el `label` no alcanza para entender a donde vuelve. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}
