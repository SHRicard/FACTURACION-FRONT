import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/shared/ui/atoms';
import {
  formatearFecha,
  formatearFechaCorta,
  formatearMoneda,
  tonoEstadoFactura,
} from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { FacturaAbierta } from '../types';

/**
 * Como se lee el plazo, con la fecha entera.
 *
 * La version corta de `shared/utils` es para una fila de lista; aca hay lugar
 * para el dia exacto, que es lo que se mira cuando se tiene al cliente delante.
 */
function textoVencimiento(factura: FacturaAbierta): string {
  const fecha = formatearFecha(factura.venceEl) ?? 'sin fecha';
  if (factura.vencida) return `Vencio el ${fecha}`;
  if (factura.diasParaVencer === 0) return `Vence hoy, ${fecha}`;
  if (factura.diasParaVencer === 1) return `Vence manana, ${fecha}`;
  return `Vence en ${factura.diasParaVencer} dias, el ${fecha}`;
}

interface TarjetaFacturaAbiertaProps {
  factura: FacturaAbierta;
  /** Sin esto la tarjeta es solo informativa. Con esto, abre la cuenta entera. */
  onPress?: (facturaId: string) => void;
}

/** La factura en curso: cuanto debe y hasta cuando tiene tiempo. */
export function TarjetaFacturaAbierta({ factura, onPress }: TarjetaFacturaAbiertaProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const Contenedor = onPress ? Pressable : View;

  // "Te pago el 30": la fecha se movio, pero el atraso se mide contra la original.
  const vencimientoAnterior = factura.reprogramada
    ? formatearFechaCorta(factura.vencimientoOriginal)
    : null;

  return (
    <Contenedor
      onPress={onPress ? () => onPress(factura.id) : undefined}
      style={[styles.tarjeta, factura.vencida && styles.vencida]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={
        onPress ? `Ver la factura en curso, saldo ${formatearMoneda(factura.saldo)}` : undefined
      }
    >
      <View style={styles.encabezado}>
        <Text variant="caption" tone="muted">
          Factura en curso
        </Text>
        <View style={styles.espacio} />
        <Badge label={factura.estadoVisible} tone={tonoEstadoFactura(factura.estadoVisible)} />
        {onPress ? <ChevronRight size={18} color={theme.colors.textMuted} /> : null}
      </View>

      <Text variant="title" weight="bold" family="text">
        {formatearMoneda(factura.saldo)}
      </Text>

      <Text variant="body" tone={factura.vencida ? 'error' : 'muted'}>
        {textoVencimiento(factura)}
      </Text>

      {vencimientoAnterior ? (
        <Text variant="caption" tone="muted">
          Reprogramada (antes: {vencimientoAnterior})
        </Text>
      ) : null}

      <Text variant="caption" tone="muted">
        {factura.cantidadTickets === 1
          ? '1 ticket cargado'
          : `${factura.cantidadTickets} tickets cargados`}
      </Text>
    </Contenedor>
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
    // El borde de color acompana al chip y al texto, no los reemplaza.
    vencida: { borderColor: theme.colors.error },
    encabezado: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    espacio: { flex: 1 },
  });
