import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

export interface Pestana<T extends string> {
  clave: T;
  etiqueta: string;
}

interface PestanasProps<T extends string> {
  opciones: readonly Pestana<T>[];
  activa: T;
  onCambiar: (clave: T) => void;
}

/**
 * Control segmentado para cambiar de vista dentro del catalogo.
 *
 * Vive en la feature y no en `shared/ui/atoms` porque hoy lo usa una sola
 * pantalla. El dia que lo necesite una segunda, se promueve.
 */
export function Pestanas<T extends string>({ opciones, activa, onCambiar }: PestanasProps<T>) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.riel} accessibilityRole="tablist">
      {opciones.map(({ clave, etiqueta }) => {
        const seleccionada = clave === activa;

        return (
          <Pressable
            key={clave}
            onPress={() => onCambiar(clave)}
            style={[styles.pestana, seleccionada && styles.seleccionada]}
            accessibilityRole="tab"
            accessibilityState={{ selected: seleccionada }}
          >
            <Text
              variant="body"
              weight={seleccionada ? 'bold' : 'medium'}
              tone={seleccionada ? 'primary' : 'muted'}
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
    riel: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      padding: theme.spacing.xs,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
    },
    pestana: {
      flex: 1,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
    },
    // La pastilla activa se levanta del riel: en el riel manda el fondo de la
    // pantalla, no un color mas.
    seleccionada: {
      backgroundColor: theme.colors.background,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
  });
