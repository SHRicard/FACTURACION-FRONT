import { StyleSheet, View } from 'react-native';

import { Text, type TextTone } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface DatoChicoProps {
  etiqueta: string;
  valor: string;
  /** Una linea de contexto debajo del numero. */
  detalle?: string;
  tono?: TextTone;
}

/**
 * Un numero secundario, de a dos por fila. Se usan dentro de una fila con
 * `flexWrap`: la base del 45% deja lugar al espacio entre las dos y `flexGrow`
 * las estira a partes iguales.
 */
export function DatoChico({ etiqueta, valor, detalle, tono = 'default' }: DatoChicoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View
      style={styles.dato}
      accessible
      accessibilityLabel={[`${etiqueta}: ${valor}`, detalle].filter(Boolean).join('. ')}
    >
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {etiqueta}
      </Text>
      <Text
        variant="body"
        weight="bold"
        family="text"
        tone={tono}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {valor}
      </Text>
      {detalle ? (
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {detalle}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    dato: {
      flexBasis: '45%',
      flexGrow: 1,
      gap: 2,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  });
