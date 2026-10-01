import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import type { Opcion } from '../types';

interface SelectorOpcionesProps<T extends string | number> {
  opciones: readonly Opcion<T>[];
  activa: T;
  onCambiar: (clave: T) => void;
  /** Para el lector de pantalla: que se esta eligiendo ("Periodo"). */
  etiqueta: string;
}

/**
 * Chips de una sola eleccion: periodo, dias sin comprar, estado.
 *
 * Van en una fila con scroll horizontal para que, si no entran, no se apilen en
 * dos renglones y empujen la lista para abajo.
 */
export function SelectorOpciones<T extends string | number>({
  opciones,
  activa,
  onCambiar,
  etiqueta,
}: SelectorOpcionesProps<T>) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.fila}
      keyboardShouldPersistTaps="handled"
      accessibilityRole="radiogroup"
      accessibilityLabel={etiqueta}
    >
      {opciones.map(({ clave, etiqueta: texto }) => {
        const seleccionada = clave === activa;

        return (
          <Pressable
            key={String(clave)}
            onPress={() => onCambiar(clave)}
            style={({ pressed }) => [
              styles.chip,
              seleccionada && styles.activa,
              pressed && styles.presionada,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: seleccionada }}
            accessibilityLabel={texto}
          >
            <Text
              variant="caption"
              weight={seleccionada ? 'bold' : 'medium'}
              tone={seleccionada ? 'onPrimary' : 'default'}
            >
              {texto}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // Sin esto, dentro de una columna el scroll horizontal se estira a lo alto.
    scroll: { flexGrow: 0 },
    fila: { flexDirection: 'row', gap: theme.spacing.sm, paddingRight: theme.spacing.sm },
    chip: {
      justifyContent: 'center',
      minHeight: 32,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    activa: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    presionada: { opacity: 0.7 },
  });
