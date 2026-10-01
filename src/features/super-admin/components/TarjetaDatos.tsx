import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text, type TextTone } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface DatoProps {
  etiqueta: string;
  valor: string;
  tono?: TextTone;
  /** Monoespaciado: una huella, una version, lo que se copia caracter a caracter. */
  mono?: boolean;
}

/** Un dato de una ficha. Etiqueta y valor se leen juntos. */
export function Dato({ etiqueta, valor, tono = 'default', mono = false }: DatoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.dato} accessible accessibilityLabel={`${etiqueta}: ${valor}`}>
      <Text variant="caption" tone="muted">
        {etiqueta}
      </Text>
      <Text variant="body" weight="medium" family="text" tone={tono} style={mono && styles.mono}>
        {valor}
      </Text>
    </View>
  );
}

/** El recuadro que agrupa varios `Dato`. */
export function TarjetaDatos({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return <View style={styles.tarjeta}>{children}</View>;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    tarjeta: {
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
    },
    dato: {
      gap: 2,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    mono: { fontFamily: theme.typography.mono },
  });
