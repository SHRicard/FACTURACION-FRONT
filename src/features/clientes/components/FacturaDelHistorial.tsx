import { ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/shared/ui/atoms';
import {
  chipCumplimiento,
  formatearFechaCorta,
  formatearMoneda,
  tonoEstadoFactura,
} from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { FacturaDelHistorial as Factura } from '../types';

/** La linea de abajo del numero: como termino, o como viene. */
function comoViene(factura: Factura): string {
  if (factura.estado === 'anulada') return 'Anulada';
  if (factura.estado === 'pagada') {
    const el = formatearFechaCorta(factura.pagadaEl);
    return `${el ? `Saldada el ${el}` : 'Saldada'} · fió ${formatearMoneda(factura.totalFiado)}`;
  }
  const vence = formatearFechaCorta(factura.venceEl) ?? '—';
  return `${factura.vencida ? 'Venció' : 'Vence'} el ${vence} · debe ${formatearMoneda(factura.saldo)}`;
}

interface FacturaDelHistorialProps {
  factura: Factura;
  onPress: (id: string) => void;
}

/**
 * Una factura del cliente en su historial: la en curso arriba, y las saldadas
 * como registro, cada una con su cumplimiento. Tocarla abre la cuenta entera.
 */
function FacturaDelHistorialComponent({ factura, onPress }: FacturaDelHistorialProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  // El numero se asigna al saldarla: la factura en curso no tiene.
  const etiqueta = factura.numero
    ? `N° ${String(factura.numero).padStart(4, '0')}`
    : 'Factura en curso';
  const linea = comoViene(factura);
  const cumplimiento = chipCumplimiento(factura);
  // "Te pago el 30": la fecha se movio, pero el atraso se mide contra la original.
  const vencimientoAnterior = factura.reprogramada
    ? formatearFechaCorta(factura.vencimientoOriginal)
    : null;

  return (
    <Pressable
      onPress={() => onPress(factura.id)}
      style={({ pressed }) => [
        styles.fila,
        factura.vencida && styles.vencida,
        pressed && styles.presionada,
      ]}
      accessibilityRole="button"
      accessibilityLabel={[etiqueta, factura.estadoVisible, linea, cumplimiento?.label]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint="Abre la factura"
    >
      <View style={styles.datos}>
        <View style={styles.encabezado}>
          <Text variant="body" weight="medium" numberOfLines={1} style={styles.etiqueta}>
            {etiqueta}
          </Text>
          {/* El chip sale de `estadoVisible`, NUNCA de `estado`. */}
          <Badge label={factura.estadoVisible} tone={tonoEstadoFactura(factura.estadoVisible)} />
        </View>
        <Text variant="caption" tone={factura.vencida ? 'error' : 'muted'}>
          {linea}
        </Text>
        {vencimientoAnterior ? (
          <Text variant="caption" tone="muted">
            Reprogramada (antes: {vencimientoAnterior})
          </Text>
        ) : null}
        {cumplimiento ? (
          <View style={styles.chip}>
            <Badge label={cumplimiento.label} tone={cumplimiento.tone} />
          </View>
        ) : null}
      </View>
      <ChevronRight size={20} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export const FacturaDelHistorial = memo(FacturaDelHistorialComponent);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      minHeight: 44,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    // El borde acompana al chip y al texto en rojo, no los reemplaza.
    vencida: { borderColor: theme.colors.error },
    presionada: { opacity: 0.7 },
    datos: { flex: 1, gap: 2 },
    encabezado: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    etiqueta: { flexShrink: 1 },
    // Sin esto el chip se estira a todo el ancho de la columna.
    chip: { alignSelf: 'flex-start', marginTop: theme.spacing.xs },
  });
