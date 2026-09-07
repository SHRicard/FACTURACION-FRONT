import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface TarjetaResumenProps {
  /** Que mide. Ej. "Facturado este mes". */
  etiqueta: string;
  /** El numero, ya formateado. Si todavia no hay dato, un guion. */
  valor: string;
  /** Contexto del numero. Ej. "12 facturas emitidas". */
  detalle?: string;
  icono: ReactNode;
}

/** Una metrica del dashboard. Muestra lo que recibe: no calcula ni pide nada. */
export function TarjetaResumen({ etiqueta, valor, detalle, icono }: TarjetaResumenProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    // Se lee como una sola unidad: si no, el lector de pantalla dicta la
    // etiqueta, el numero y el detalle como tres cosas sueltas sin relacion.
    <View style={styles.tarjeta} accessible accessibilityLabel={`${etiqueta}: ${valor}`}>
      <View style={styles.encabezado}>
        <Text variant="caption" tone="muted" numberOfLines={1} style={styles.etiqueta}>
          {etiqueta}
        </Text>
        {icono}
      </View>
      <Text variant="heading" weight="bold" family="text">
        {valor}
      </Text>
      {detalle ? (
        <Text variant="caption" tone="muted">
          {detalle}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    tarjeta: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    // Sin esto, una etiqueta larga empuja el icono fuera de la tarjeta.
    etiqueta: { flexShrink: 1 },
  });
