import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text, type TextTone } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface TarjetaEstadisticaProps {
  icono: LucideIcon;
  etiqueta: string;
  valor: string;
  tono?: TextTone;
}

/** Un numero de la marca: que es, y cuanto. */
export function TarjetaEstadistica({
  icono: Icono,
  etiqueta,
  valor,
  tono = 'default',
}: TarjetaEstadisticaProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.tarjeta} accessible accessibilityLabel={`${etiqueta}: ${valor}`}>
      <View style={styles.encabezado}>
        <Icono size={16} color={theme.colors.textMuted} />
        <Text variant="caption" tone="muted">
          {etiqueta}
        </Text>
      </View>
      <Text
        variant="title"
        weight="bold"
        family="text"
        tone={tono}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {valor}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // Dos por fila en un telefono: la base del 45% deja lugar al espacio entre
    // las dos y `flexGrow` las estira a partes iguales.
    tarjeta: {
      flexBasis: '45%',
      flexGrow: 1,
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    encabezado: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  });
