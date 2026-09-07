import { memo, useMemo } from 'react';
import { View, type DimensionValue, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { createStyles } from './Container.styles';
import type { ContainerProps } from './Container.types';

/**
 * Limita el ancho del contenido y lo centra.
 *
 * Ocupa el 90% del ancho disponible (el 10% restante son los margenes) y despues
 * aplica un tope segun QUE contenido lleve adentro. Por eso un listado usa toda
 * la pantalla y un formulario no: el formulario tiene su propio techo.
 *
 * No pregunta por la plataforma, solo por el ancho, asi que resuelve igual el
 * caso de una tablet en horizontal.
 *
 * Toda pantalla deberia envolver su contenido en un Container.
 */
function ContainerComponent({ children, ancho = 'contenido', style }: ContainerProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(), []);

  const dinamico = useMemo<ViewStyle>(
    () => ({
      // `completo` va de borde a borde; el resto respeta los margenes.
      width: (ancho === 'completo' ? '100%' : theme.layout.anchoUtil) as DimensionValue,
      maxWidth: theme.layout.maxWidth[ancho],
    }),
    [ancho, theme.layout.anchoUtil, theme.layout.maxWidth],
  );

  return <View style={[styles.base, dinamico, style]}>{children}</View>;
}

export const Container = memo(ContainerComponent);
