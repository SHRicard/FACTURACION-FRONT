import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

type SeccionProps = {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
};

/** Bloque del catalogo: un titulo y lo que se este mostrando debajo. */
export function Seccion({ titulo, descripcion, children }: SeccionProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.seccion}>
      <View style={styles.encabezado}>
        <Text variant="title" weight="bold" accessibilityRole="header">
          {titulo}
        </Text>
        {descripcion ? (
          <Text variant="caption" tone="muted">
            {descripcion}
          </Text>
        ) : null}
      </View>
      <View style={styles.cuerpo}>{children}</View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    seccion: { gap: theme.spacing.md },
    encabezado: { gap: theme.spacing.xs },
    cuerpo: {
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  });
