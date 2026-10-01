import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text, type TextTone } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface TarjetaResumenProps {
  /** Que mide. Ej. "Vendiste este mes". */
  etiqueta: string;
  /** El numero, ya formateado. Si todavia no hay dato, un guion. */
  valor: string;
  /** Contexto del numero. Ej. "8 tickets · 6 clientes". */
  detalle?: string;
  tono?: TextTone;
  icono: ReactNode;
  /** Lo que va debajo y le pertenece: la variacion, una curva. */
  children?: ReactNode;
}

/** Una metrica del dashboard. Muestra lo que recibe: no calcula ni pide nada. */
export function TarjetaResumen({
  etiqueta,
  valor,
  detalle,
  tono = 'default',
  icono,
  children,
}: TarjetaResumenProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.tarjeta}>
      {/* Se lee como una sola unidad: si no, el lector de pantalla dicta la
          etiqueta, el numero y el detalle como tres cosas sueltas sin relacion. */}
      <View
        style={styles.textos}
        accessible
        accessibilityLabel={[`${etiqueta}: ${valor}`, detalle].filter(Boolean).join('. ')}
      >
        <View style={styles.encabezado}>
          <Text variant="caption" tone="muted" numberOfLines={1} style={styles.etiqueta}>
            {etiqueta}
          </Text>
          {icono}
        </View>
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
          <Text variant="caption" tone="muted">
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
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    textos: { gap: theme.spacing.xs },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    // Sin esto, una etiqueta larga empuja el icono fuera de la tarjeta.
    etiqueta: { flexShrink: 1 },
  });
