import { ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/shared/ui/atoms';
import {
  chipCumplimiento,
  formatearFechaCorta,
  formatearMoneda,
  textoVencimiento,
  tonoEstadoFactura,
} from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { FacturaEnLista } from '../types';

interface FilaFacturaProps {
  factura: FacturaEnLista;
  onPress: (id: string) => void;
}

/**
 * Una fila del listado de facturacion.
 *
 * El cliente viene resuelto adentro de la factura, asi que la fila se dibuja
 * sin una segunda consulta.
 */
function FilaFacturaComponent({ factura, onPress }: FilaFacturaProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  /*
   * El numero se asigna al SALDARLA, no al abrir: la factura en curso no tiene.
   * Por eso se chequea con `if` y no se muestra "N° undefined".
   */
  const etiqueta = factura.numero
    ? `N° ${String(factura.numero).padStart(4, '0')}`
    : 'Factura en curso';

  const tickets = factura.cantidadTickets === 1 ? '1 ticket' : `${factura.cantidadTickets} tickets`;

  // Una saldada ya no corre plazo: se dice cuando se termino de pagar.
  const saldadaEl = factura.estado === 'pagada' ? formatearFechaCorta(factura.pagadaEl) : null;
  const plazo = saldadaEl ? `saldada el ${saldadaEl}` : textoVencimiento(factura.diasParaVencer);

  // Que tan bien pago. Solo en la saldada y en la vencida: ver `chipCumplimiento`.
  const cumplimiento = chipCumplimiento(factura);

  return (
    <Pressable
      onPress={() => onPress(factura.id)}
      style={({ pressed }) => [
        styles.fila,
        factura.vencida && styles.vencida,
        pressed && styles.presionada,
      ]}
      accessibilityRole="button"
      accessibilityLabel={[
        factura.cliente.nombre,
        factura.estadoVisible,
        `saldo ${formatearMoneda(factura.saldo)}`,
        cumplimiento?.label,
      ]
        .filter(Boolean)
        .join(', ')}
    >
      <View style={styles.datos}>
        <View style={styles.encabezado}>
          <Text variant="body" weight="medium" numberOfLines={1} style={styles.nombre}>
            {factura.cliente.nombre}
          </Text>
          {/* El chip sale de `estadoVisible`, NUNCA de `estado`: "vencida" y
              "sin deuda" no existen del lado guardado. */}
          <Badge label={factura.estadoVisible} tone={tonoEstadoFactura(factura.estadoVisible)} />
        </View>

        <Text variant="caption" tone="muted" numberOfLines={1}>
          DNI {factura.cliente.dni}
        </Text>

        <Text variant="caption" tone={factura.vencida ? 'error' : 'muted'} numberOfLines={1}>
          {etiqueta} · {tickets} · {plazo}
        </Text>

        {cumplimiento ? (
          <View style={styles.chip}>
            <Badge label={cumplimiento.label} tone={cumplimiento.tone} />
          </View>
        ) : null}
      </View>

      <View style={styles.montos}>
        <Text
          variant="body"
          weight="bold"
          family="text"
          tone={factura.vencida ? 'error' : factura.saldo > 0 ? 'default' : 'muted'}
        >
          {formatearMoneda(factura.saldo)}
        </Text>
        <Text variant="caption" tone="muted">
          {factura.saldo > 0 ? 'saldo' : 'al dia'}
        </Text>
      </View>

      <ChevronRight size={20} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export const FilaFactura = memo(FilaFacturaComponent);

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
    // `flex: 1` para que un nombre largo se recorte en vez de empujar el monto.
    datos: { flex: 1, gap: 2 },
    encabezado: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    nombre: { flexShrink: 1 },
    // Sin esto el chip se estira a todo el ancho de la columna.
    chip: { alignSelf: 'flex-start', marginTop: theme.spacing.xs },
    montos: { alignItems: 'flex-end' },
  });
