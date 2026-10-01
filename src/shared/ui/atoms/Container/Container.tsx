import { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { createStyles } from './Container.styles';
import type { ContainerProps } from './Container.types';

/**
 * Le da al contenido de una pantalla sus margenes laterales.
 *
 * Ocupa TODO el ancho disponible menos `margenPantalla` de cada lado, en
 * cualquier tamano de telefono. No tiene tope de ancho a proposito: la app es
 * movil, y un tope dejaba el contenido como una columna angosta en el medio de
 * los telefonos grandes y los plegables.
 *
 * Toda pantalla deberia envolver su contenido en un Container.
 */
function ContainerComponent({ children, style }: ContainerProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <View style={[styles.base, style]}>{children}</View>;
}

export const Container = memo(ContainerComponent);
