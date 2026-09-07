import { memo, useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme';

import { createStyles } from './Button.styles';
import type { ButtonProps } from './Button.types';

function ButtonComponent({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const bloqueado = disabled || loading;
  // El spinner tiene que contrastar contra el fondo de la variante.
  const colorSpinner =
    variant === 'primary' || variant === 'danger' ? theme.colors.onPrimary : theme.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={bloqueado}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: bloqueado, busy: loading }}
      // `sm` dibuja 36px de alto: el hitSlop devuelve el area tocable a 44+ sin
      // agrandar el boton. En los otros tamanos solo da margen.
      hitSlop={theme.spacing.xs}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        fullWidth && styles.fullWidth,
        bloqueado && styles.disabled,
        pressed && !bloqueado && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colorSpinner} />
      ) : (
        <View style={[styles.content, size === 'sm' && styles.smContent]}>
          {leftIcon}
          <Text style={[styles.label, styles[`${size}Label`], styles[`${variant}Label`]]}>
            {label}
          </Text>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}

export const Button = memo(ButtonComponent);
