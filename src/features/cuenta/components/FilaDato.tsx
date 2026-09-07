import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface FilaDatoProps {
  etiqueta: string;
  valor: string;
}

/** Un dato del perfil: que es, y cuanto vale. Solo muestra. */
export function FilaDato({ etiqueta, valor }: FilaDatoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    // Etiqueta y valor se leen juntos: sueltos, el lector de pantalla dicta
    // "Email" y "algo@algo.com" como dos elementos sin relacion.
    <View style={styles.fila} accessible accessibilityLabel={`${etiqueta}: ${valor}`}>
      <Text variant="caption" tone="muted">
        {etiqueta}
      </Text>
      <Text variant="body" weight="medium" family="text">
        {valor}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: {
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
  });
