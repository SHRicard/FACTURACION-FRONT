import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { iniciales } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { imagenAlTamano } from '../logo';

interface AvatarInicialesProps {
  nombre: string;
  /** Si hay imagen (el logo, la foto de Google), va en lugar de las letras. */
  imagen?: string;
  grande?: boolean;
}

/** El lado del circulo. Lo usan el estilo y el pedido de la imagen, que tienen que coincidir. */
const ladoDe = (theme: Theme, grande: boolean) =>
  grande ? theme.spacing.xxl + theme.spacing.md : theme.spacing.xl + theme.spacing.sm;

/** Un circulo con la imagen, o con las iniciales si no hay. */
export function AvatarIniciales({ nombre, imagen, grande = false }: AvatarInicialesProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const estilo = [styles.circulo, grande && styles.grande];

  if (imagen) {
    return (
      <Image
        // Del tamaño del circulo, no el original de hasta 1000×1000.
        source={{ uri: imagenAlTamano(imagen, ladoDe(theme, grande)) }}
        style={estilo}
        accessibilityIgnoresInvertColors
        accessibilityLabel={nombre}
      />
    );
  }

  return (
    <View style={estilo} accessibilityElementsHidden importantForAccessibility="no">
      <Text variant={grande ? 'title' : 'body'} weight="bold" family="text" tone="onPrimary">
        {iniciales(nombre) || '?'}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    circulo: {
      width: ladoDe(theme, false),
      height: ladoDe(theme, false),
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
    },
    grande: {
      width: ladoDe(theme, true),
      height: ladoDe(theme, true),
    },
  });
