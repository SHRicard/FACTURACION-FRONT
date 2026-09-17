import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, type TextTone } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface FilaCobranzaProps {
  icono: ReactNode;
  /** Que es. Ej. "A cobrar". */
  etiqueta: string;
  /** La plata, ya formateada. */
  valor: string;
  /** A quien y hace cuanto, en una linea. */
  detalle: string;
  tono?: TextTone;
  onPress: () => void;
}

/**
 * Una cosa para hacer hoy: lo vencido, lo que esta por vencer, los que se
 * fueron debiendo y los que pasaron su limite.
 *
 * Es la franja de arriba del Inicio: lo accionable va primero, y cada renglon
 * lleva a donde se resuelve.
 */
export function FilaCobranza({
  icono,
  etiqueta,
  valor,
  detalle,
  tono = 'default',
  onPress,
}: FilaCobranzaProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
      accessibilityRole="button"
      accessibilityLabel={`${etiqueta}: ${valor}. ${detalle}`}
    >
      <View style={styles.icono}>{icono}</View>
      <View style={styles.datos}>
        <Text variant="body" weight="medium" numberOfLines={1}>
          {etiqueta}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {detalle}
        </Text>
      </View>
      <Text variant="body" weight="bold" family="text" tone={tono}>
        {valor}
      </Text>
      <ChevronRight size={20} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      minHeight: 44,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    presionada: { opacity: 0.7 },
    icono: {
      alignItems: 'center',
      justifyContent: 'center',
      width: theme.spacing.xl,
      height: theme.spacing.xl,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    // `flex: 1` para que un texto largo se recorte en vez de empujar el monto.
    datos: { flex: 1, gap: 2 },
  });
