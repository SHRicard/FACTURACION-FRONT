import { MessageCircle } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface BotonWhatsAppProps {
  onPress: () => void;
  /** A quien se le escribe, para el lector de pantalla. */
  nombre: string;
}

/**
 * El atajo para escribirle al cliente sin salir de la lista. Va como pastilla
 * chica al lado de los chips: es secundario a tocar el renglon, que abre la
 * ficha con todo.
 */
export function BotonWhatsApp({ onPress, nombre }: BotonWhatsAppProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={theme.spacing.xs}
      style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
      accessibilityRole="button"
      accessibilityLabel={`Escribirle a ${nombre} por WhatsApp`}
    >
      <MessageCircle size={14} color={theme.colors.primary} />
      <Text variant="caption" weight="bold" tone="primary">
        WhatsApp
      </Text>
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    boton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      minHeight: 32,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    presionado: { opacity: 0.6 },
  });
