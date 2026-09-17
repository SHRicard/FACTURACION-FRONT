import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface TarjetaMetricaProps {
  icono: LucideIcon;
  titulo: string;
  /** Para que sirve, en una frase: es lo que ayuda a elegir cual abrir. */
  descripcion: string;
  onPress: () => void;
}

/** Una entrada del menu de metricas: que es y para que sirve. */
export function TarjetaMetrica({
  icono: Icono,
  titulo,
  descripcion,
  onPress,
}: TarjetaMetricaProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={descripcion}
    >
      <View style={styles.icono}>
        <Icono size={theme.typography.size.body + 2} color={theme.colors.primary} />
      </View>
      <View style={styles.textos}>
        <Text variant="body" weight="medium">
          {titulo}
        </Text>
        <Text variant="caption" tone="muted">
          {descripcion}
        </Text>
      </View>
      <ChevronRight size={20} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      minHeight: 44,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    presionada: { opacity: 0.7 },
    icono: {
      alignItems: 'center',
      justifyContent: 'center',
      width: theme.spacing.xl + theme.spacing.xs,
      height: theme.spacing.xl + theme.spacing.xs,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    textos: { flex: 1, gap: theme.spacing.xs },
  });
