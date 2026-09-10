import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { FILTROS_FACTURAS, type FiltroFacturas } from '../hooks';

interface ChipsFiltroProps {
  activo: FiltroFacturas;
  onCambiar: (filtro: FiltroFacturas) => void;
}

/**
 * Los filtros del listado: uno solo prendido a la vez.
 *
 * Excluyentes y no combinables porque "vencidas" no es un estado: mezclarlo con
 * "pagadas" daria siempre vacio. Ver `useFacturas`.
 */
export function ChipsFiltro({ activo, onCambiar }: ChipsFiltroProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.fila}
      // Con cuatro chips entran en cualquier telefono; el scroll esta por si
      // manana son seis, para que no se apilen en dos renglones.
      keyboardShouldPersistTaps="handled"
    >
      {FILTROS_FACTURAS.map(({ clave, etiqueta }) => {
        const seleccionado = clave === activo;

        return (
          <Pressable
            key={clave}
            onPress={() => onCambiar(clave)}
            style={({ pressed }) => [
              styles.chip,
              seleccionado && styles.activo,
              pressed && styles.presionado,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: seleccionado }}
            accessibilityLabel={etiqueta}
          >
            <Text
              variant="caption"
              weight={seleccionado ? 'bold' : 'medium'}
              tone={seleccionado ? 'onPrimary' : 'default'}
            >
              {etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
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
    activo: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    presionado: { opacity: 0.7 },
  });
