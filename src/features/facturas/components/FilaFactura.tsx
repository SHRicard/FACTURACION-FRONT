import { ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/shared/ui/atoms';
import { formatearMoneda, textoVencimiento, tonoEstadoFactura } from '@/shared/utils';
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
   * El numero se asigna al CERRAR, no al abrir: una abierta no tiene. Por eso
   * se chequea con `if` y no se muestra "N° undefined".
   */
  const periodo = factura.numero
    ? `N° ${String(factura.numero).padStart(4, '0')}`
    : 'Período en curso';

  const tickets = factura.cantidadTickets === 1 ? '1 ticket' : `${factura.cantidadTickets} tickets`;

  return (
    <Pressable
      onPress={() => onPress(factura.id)}
      style={({ pressed }) => [
        styles.fila,
        factura.vencida && styles.vencida,
        pressed && styles.presionada,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${factura.cliente.nombre}, ${factura.estadoVisible}, saldo ${formatearMoneda(factura.saldo)}`}
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
          {periodo} · {tickets} · {textoVencimiento(factura.diasParaVencer)}
        </Text>
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
    montos: { alignItems: 'flex-end' },
  });
