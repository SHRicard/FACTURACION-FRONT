import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

type MuestraProps = {
  /** Como se escribe en codigo (ej. `variant="primary"`). */
  codigo: string;
  children: ReactNode;
};

/**
 * Una muestra del catalogo: el componente renderizado y, debajo, como se invoca.
 * Lo segundo es lo que hace util la pantalla — se copia y se pega.
 */
export function Muestra({ codigo, children }: MuestraProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.muestra}>
      <View>{children}</View>
      <Text variant="caption" tone="muted" style={styles.codigo}>
        {codigo}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    muestra: { gap: theme.spacing.xs },
    codigo: { fontFamily: 'monospace' },
  });
