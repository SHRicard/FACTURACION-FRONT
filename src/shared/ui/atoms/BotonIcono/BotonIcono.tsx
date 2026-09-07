import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, type Theme } from '@/theme';

import type { BotonIconoProps } from './BotonIcono.types';

/**
 * Boton de un solo icono, sin fondo ni recuadro.
 *
 * Es el boton de las barras de navegacion: en iOS una accion de la barra es un
 * glifo suelto en el color de acento, no un boton con contorno. El recuadro lo
 * agrega Android, y mezclarlos hace que la barra se vea cargada.
 *
 * El `accessibilityLabel` NO es opcional: sin texto visible, es lo unico que
 * tiene un lector de pantalla para decir que hace el boton.
 */
function BotonIconoComponent({
  children,
  onPress,
  accessibilityLabel,
  disabled = false,
  style,
}: BotonIconoProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }): StyleProp<ViewStyle> => [
        styles.base,
        pressed && !disabled && styles.presionado,
        disabled && styles.apagado,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      // 44px de area tocable aunque el glifo dibuje 22: es el minimo comodo.
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.md,
    },
    // Sin fondo que cambie: en una barra de navegacion el feedback es la
    // opacidad, como en iOS.
    presionado: { opacity: 0.4 },
    apagado: { opacity: 0.4 },
  });

export const BotonIcono = memo(BotonIconoComponent);
