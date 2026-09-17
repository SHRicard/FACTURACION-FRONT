import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { colorDeTono, type TonoMetrica } from './tonos';

interface BarraProporcionProps {
  etiqueta: string;
  /** El numero de la barra, ya formateado ("$ 10.000", "52,6 %"). */
  valor: string;
  /** Contexto en una linea ("1 factura · 1 cliente"). */
  detalle?: string;
  /** Cuanto se llena, de 0 a 1. */
  proporcion: number;
  tono: TonoMetrica;
  /** Con esto la barra se toca: abre o cierra lo que tiene debajo. */
  onPress?: () => void;
  seleccionada?: boolean;
  /**
   * El toque lleva a otra pantalla (el detalle de una especie) en vez de
   * desplegar algo debajo: flecha al costado y sin estado de abierta o cerrada.
   */
  abre?: boolean;
  /** Apagada: sigue a la vista (el orden importa) pero no compite con las otras. */
  atenuada?: boolean;
}

/**
 * Una barra horizontal con su etiqueta y su numero: un tramo de la deuda, una
 * especie. Horizontal y no vertical porque las etiquetas son largas ("Todavia
 * no vencio") y en un telefono no entran debajo de una columna.
 */
function BarraProporcionComponent({
  etiqueta,
  valor,
  detalle,
  proporcion,
  tono,
  onPress,
  seleccionada = false,
  abre = false,
  atenuada = false,
}: BarraProporcionProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const lleno = Math.max(0, Math.min(1, proporcion));
  const IconoFlecha = abre ? ChevronRight : seleccionada ? ChevronUp : ChevronDown;

  const contenido = (
    <>
      <View style={styles.encabezado}>
        <Text variant="body" weight="medium" numberOfLines={1} style={styles.etiqueta}>
          {etiqueta}
        </Text>
        <Text variant="body" weight="bold" family="text">
          {valor}
        </Text>
        {onPress ? <IconoFlecha size={18} color={theme.colors.textMuted} /> : null}
      </View>
      <View style={styles.pista}>
        <View
          style={[
            styles.relleno,
            // Un tramo con algo, por chico que sea, se tiene que ver: si no, un
            // 0,4 % y un 0 quedan iguales.
            lleno > 0 && styles.rellenoMinimo,
            { width: `${lleno * 100}%`, backgroundColor: colorDeTono(theme, tono) },
          ]}
        />
      </View>
      {detalle ? (
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {detalle}
        </Text>
      ) : null}
    </>
  );

  const etiquetaAccesible = [`${etiqueta}: ${valor}`, detalle].filter(Boolean).join('. ');

  if (!onPress) {
    return (
      <View
        style={[styles.bloque, atenuada && styles.atenuada]}
        accessible
        accessibilityLabel={etiquetaAccesible}
      >
        {contenido}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.bloque,
        styles.tocable,
        seleccionada && styles.seleccionada,
        atenuada && styles.atenuada,
        pressed && styles.presionada,
      ]}
      accessibilityRole="button"
      accessibilityState={abre ? undefined : { expanded: seleccionada }}
      accessibilityLabel={etiquetaAccesible}
      accessibilityHint={
        abre ? 'Abre el detalle' : seleccionada ? 'Oculta la lista' : 'Muestra la lista'
      }
    >
      {contenido}
    </Pressable>
  );
}

export const BarraProporcion = memo(BarraProporcionComponent);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bloque: { gap: theme.spacing.xs },
    tocable: {
      minHeight: 44,
      padding: theme.spacing.sm,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    seleccionada: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface },
    atenuada: { opacity: 0.5 },
    presionada: { opacity: 0.7 },
    encabezado: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    // `flex: 1` para que una etiqueta larga se recorte en vez de empujar el monto.
    etiqueta: { flex: 1 },
    pista: {
      height: theme.spacing.sm,
      overflow: 'hidden',
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.border,
    },
    relleno: { height: '100%', borderRadius: theme.radius.full },
    rellenoMinimo: { minWidth: theme.spacing.xs },
  });
