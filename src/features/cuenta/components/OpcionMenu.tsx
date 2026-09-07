import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface OpcionMenuProps {
  icono: ReactNode;
  titulo: string;
  descripcion?: string;
  onPress: () => void;
  /** `error` para lo destructivo (cerrar sesion). */
  tono?: 'default' | 'error';
  /** La flecha indica "esto abre otra pantalla". Una accion en el lugar no lleva. */
  navega?: boolean;
}

/** Una fila del menu de la cuenta. */
export function OpcionMenu({
  icono,
  titulo,
  descripcion,
  onPress,
  tono = 'default',
  navega = true,
}: OpcionMenuProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={descripcion}
      style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
    >
      {icono}
      <View style={styles.textos}>
        <Text variant="body" weight="medium" tone={tono === 'error' ? 'error' : 'default'}>
          {titulo}
        </Text>
        {descripcion ? (
          <Text variant="caption" tone="muted">
            {descripcion}
          </Text>
        ) : null}
      </View>
      {navega ? <ChevronRight size={20} color={theme.colors.textMuted} /> : null}
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      // Minimo accesible para tocar comodo.
      minHeight: 44,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    presionada: { opacity: 0.7 },
    textos: { flex: 1, gap: theme.spacing.xs },
  });
