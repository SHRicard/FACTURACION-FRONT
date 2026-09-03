import type { TextProps as RNTextProps } from 'react-native';

/** Escala tipografica del theme. */
export type TextVariant = 'caption' | 'body' | 'title' | 'heading';

export type TextWeight = 'regular' | 'medium' | 'bold';

/**
 * Familia tipografica.
 * - `text`    → Inter (texto, formularios, montos)
 * - `display` → Poppins (titulos)
 *
 * Normalmente NO se pasa: la elige la `variant`. Es un escape hatch para
 * casos puntuales (ej. un dato numerico grande que igual quiere ir en Inter).
 */
export type TextFamily = 'text' | 'display';

/** Color semantico del texto. Nunca se pasa un color crudo por props. */
export type TextTone =
  'default' | 'muted' | 'primary' | 'onPrimary' | 'error' | 'success' | 'warning';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  tone?: TextTone;
  family?: TextFamily;
  /** Centra el texto. Atajo del caso mas comun. */
  center?: boolean;
}
