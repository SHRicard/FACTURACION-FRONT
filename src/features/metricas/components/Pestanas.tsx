import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import type { Opcion } from '../types';

interface PestanasProps<T extends string> {
  opciones: readonly Opcion<T>[];
  activa: T;
  onCambiar: (clave: T) => void;
}

/**
 * Dos o tres vistas de la MISMA lista (Deudores / Morosos, Mas compran / Mejor
 * pagan). Ocupa todo el ancho y se reparte en partes iguales: se lee como un
 * interruptor, no como un filtro mas.
 */
export function Pestanas<T extends string>({ opciones, activa, onCambiar }: PestanasProps<T>) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.pista} accessibilityRole="tablist">
      {opciones.map(({ clave, etiqueta }) => {
        const seleccionada = clave === activa;

        return (
          <Pressable
            key={clave}
            onPress={() => onCambiar(clave)}
            style={({ pressed }) => [
              styles.pestana,
              seleccionada && styles.activa,
              pressed && styles.presionada,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: seleccionada }}
            accessibilityLabel={etiqueta}
          >
            <Text
              variant="caption"
              weight={seleccionada ? 'bold' : 'medium'}
              tone={seleccionada ? 'default' : 'muted'}
              numberOfLines={1}
            >
              {etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    pista: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      padding: theme.spacing.xs,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    pestana: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.sm,
    },
    // La elegida "sale" de la pista con el fondo de la pantalla y un borde.
    activa: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    presionada: { opacity: 0.7 },
  });
