import { memo, useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useBreakpoint } from '@/shared/hooks';
import { useTheme } from '@/theme';

import { createStyles } from './Container.styles';
import type { ContainerProps } from './Container.types';

/**
 * Limita el ancho del contenido y lo centra.
 *
 * Es la pieza que hace que la app se vea bien en una ventana de navegador: sin
 * esto, un formulario se estira a los 1900px de un monitor y queda ilegible.
 * No pregunta por la plataforma, solo por el ancho disponible, asi que resuelve
 * igual el caso de una tablet en horizontal.
 *
 * Toda pantalla deberia envolver su contenido en un Container.
 */
function ContainerComponent({
  children,
  ancho = 'contenido',
  conPadding = true,
  style,
}: ContainerProps) {
  const theme = useTheme();
  const { elegir } = useBreakpoint();
  const styles = useMemo(() => createStyles(), []);

  // Mas aire a los costados cuando hay lugar; en telefono el aire es un lujo.
  const paddingHorizontal = elegir({ sm: theme.spacing.lg, md: theme.spacing.xl });

  const dinamico = useMemo<ViewStyle>(
    () => ({
      maxWidth: theme.layout.maxWidth[ancho],
      paddingHorizontal: conPadding ? paddingHorizontal : 0,
    }),
    [ancho, conPadding, paddingHorizontal, theme.layout.maxWidth],
  );

  return <View style={[styles.base, dinamico, style]}>{children}</View>;
}

export const Container = memo(ContainerComponent);
