import { memo, useMemo } from 'react';
import { Text as RNText } from 'react-native';

import { useTheme } from '@/theme';

import { createStyles } from './Text.styles';
import type { TextFamily, TextProps, TextVariant, TextWeight } from './Text.types';

/** Los titulos van en Poppins; el texto y los datos, en Inter. */
const FAMILIA_POR_VARIANTE = {
  caption: 'text',
  body: 'text',
  title: 'display',
  heading: 'display',
} as const satisfies Record<TextVariant, TextFamily>;

/** (familia, peso) -> la clave del estilo que apunta al archivo de fuente. */
const CLAVE_FUENTE = {
  text: { regular: 'textRegular', medium: 'textMedium', bold: 'textBold' },
  display: { regular: 'displayRegular', medium: 'displayMedium', bold: 'displayBold' },
} as const satisfies Record<TextFamily, Record<TextWeight, string>>;

/**
 * Texto de la app. Es el unico lugar donde se decide tamano, fuente y color:
 * asi nadie hardcodea un fontSize, un fontFamily ni un color suelto.
 */
function TextComponent({
  variant = 'body',
  weight = 'regular',
  tone = 'default',
  family,
  center = false,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const familia = family ?? FAMILIA_POR_VARIANTE[variant];

  return (
    <RNText
      style={[
        styles[variant],
        styles[CLAVE_FUENTE[familia][weight]],
        styles[tone],
        center && styles.center,
        style,
      ]}
      {...rest}
    />
  );
}

export const Text = memo(TextComponent);
