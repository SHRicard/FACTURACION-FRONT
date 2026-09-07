import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface ChipFiltroProps {
  label: string;
  activo: boolean;
  onPress: () => void;
}

/** Filtro de un toque: prendido o apagado. */
export function ChipFiltro({ label, activo, onPress }: ChipFiltroProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, activo && styles.activo, pressed && styles.presionado]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: activo }}
      accessibilityLabel={label}
    >
      {/* El tilde ademas del color: prendido y apagado no se distinguen solo
          por el fondo si no percibis bien los colores. */}
      {activo ? <Check size={14} color={theme.colors.onPrimary} /> : null}
      <Text variant="caption" weight="medium" tone={activo ? 'onPrimary' : 'default'}>
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      minHeight: 32,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    activo: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    presionado: { opacity: 0.7 },
  });
