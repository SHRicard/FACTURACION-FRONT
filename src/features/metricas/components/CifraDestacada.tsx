import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text, type TextTone } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface CifraDestacadaProps {
  /** Que mide. Ej. "Tasa de cobranza". */
  etiqueta: string;
  /** El numero, ya formateado. */
  valor: string;
  /** La frase que lo explica. Ej. "La libreta crecio $ 15.000". */
  detalle?: string;
  tono?: TextTone;
  tonoDetalle?: TextTone;
  /** Lo que va debajo del numero y le pertenece (una barra, una leyenda). */
  children?: ReactNode;
}

/** El numero grande de arriba de una metrica: lo primero que se lee. */
export function CifraDestacada({
  etiqueta,
  valor,
  detalle,
  tono = 'default',
  tonoDetalle = 'muted',
  children,
}: CifraDestacadaProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.tarjeta}>
      {/* Etiqueta, numero y frase se leen como una sola cosa. */}
      <View
        style={styles.textos}
        accessible
        accessibilityLabel={[`${etiqueta}: ${valor}`, detalle].filter(Boolean).join('. ')}
      >
        <Text variant="caption" tone="muted">
          {etiqueta}
        </Text>
        <Text
          variant="heading"
          weight="bold"
          family="text"
          tone={tono}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {valor}
        </Text>
        {detalle ? (
          <Text variant="body" tone={tonoDetalle}>
            {detalle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    tarjeta: {
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    textos: { gap: theme.spacing.xs },
  });
