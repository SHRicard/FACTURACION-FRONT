import { Receipt, Wallet } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { etiquetaFactura, nombreMetodo } from '@/features/pagos/formato';
import { Badge, Text } from '@/shared/ui/atoms';
import { formatearFechaCorta, formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { Compra, Movimiento } from '../types';

/** Lo que se llevo en una compra, renglon por renglon, como en la factura. */
function ArticulosDeLaCompra({ compra }: { compra: Compra }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  // El tachado es de TEXTO, no de vista: hay que ponerlo en cada Text.
  const tachado = compra.anulado ? styles.tachado : undefined;

  return (
    <View style={styles.articulos}>
      {compra.items.map((item, indice) => {
        // El talle y la especie van en una linea: en un telefono no entra una
        // columna por dato.
        const detalle = [item.talle, item.especieNombre].filter(Boolean).join(' · ');

        return (
          // Los items no tienen id propio y la lista no se reordena: el indice alcanza.
          <View key={`${compra.id}-${indice}`} style={styles.articulo}>
            <View style={styles.flex}>
              <Text variant="body" numberOfLines={1} style={tachado}>
                {item.nombre}
              </Text>
              {detalle ? (
                <Text variant="caption" tone="muted" numberOfLines={1} style={tachado}>
                  {detalle}
                </Text>
              ) : null}
            </View>
            <Text variant="caption" tone="muted" style={tachado}>
              x{item.cantidad}
            </Text>
            <Text variant="body" family="text" style={[styles.subtotal, tachado]}>
              {formatearMoneda(item.subtotal)}
            </Text>
          </View>
        );
      })}
      <Text variant="caption" tone="muted" style={tachado}>
        Dejó {formatearMoneda(compra.pagado)} · se anotó {formatearMoneda(compra.faltante)}
      </Text>
    </View>
  );
}

interface MovimientoHistorialProps {
  movimiento: Movimiento;
}

/**
 * Un movimiento del historial: una compra, con lo que se llevo, o un pago a
 * cuenta. Los anulados NO desaparecen: quedan tachados, con el motivo, igual
 * que en la factura.
 */
function MovimientoHistorialComponent({ movimiento }: MovimientoHistorialProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const esCompra = movimiento.tipo === 'compra';
  const tachado = movimiento.anulado ? styles.tachado : undefined;
  const Icono = esCompra ? Receipt : Wallet;
  const quien = movimiento.registradoPor?.nombre;

  const titulo =
    movimiento.tipo === 'compra' ? 'Compra' : `Pago · ${nombreMetodo(movimiento.metodoPago)}`;
  const monto = movimiento.tipo === 'compra' ? movimiento.total : movimiento.monto;
  const contexto = [
    formatearFechaCorta(movimiento.fecha),
    movimiento.factura ? etiquetaFactura(movimiento.factura.numero) : null,
    quien ? `${esCompra ? 'cargó' : 'cobró'} ${quien}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.tarjeta, movimiento.anulado && styles.anulado]}>
      <View style={styles.encabezado}>
        <View style={styles.icono}>
          <Icono size={16} color={esCompra ? theme.colors.primary : theme.colors.success} />
        </View>
        <View style={styles.flex}>
          <Text variant="body" weight="medium" numberOfLines={1} style={tachado}>
            {titulo}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {contexto}
          </Text>
        </View>
        <Text
          variant="body"
          weight="bold"
          family="text"
          tone={movimiento.anulado ? 'muted' : esCompra ? 'default' : 'success'}
          style={tachado}
        >
          {formatearMoneda(monto)}
        </Text>
      </View>

      {movimiento.tipo === 'compra' ? (
        <ArticulosDeLaCompra compra={movimiento} />
      ) : movimiento.nota ? (
        <Text variant="caption" tone="muted" style={tachado}>
          {`"${movimiento.nota}"`}
        </Text>
      ) : null}

      {movimiento.anulado ? (
        <View style={styles.linea}>
          {/* La palabra ademas del gris: el tachado solo no lo lee quien no lo ve. */}
          <Badge label="Anulado" tone="neutral" />
          <Text variant="caption" tone="muted" numberOfLines={2} style={styles.flex}>
            {movimiento.motivoAnulacion ? `motivo: ${movimiento.motivoAnulacion}` : 'sin motivo'}
          </Text>
        </View>
      ) : movimiento.saldoPosterior != null ? (
        <Text variant="caption" tone="muted">
          {movimiento.saldoPosterior > 0
            ? `Después de esto debía ${formatearMoneda(movimiento.saldoPosterior)}`
            : 'Después de esto quedó al día'}
        </Text>
      ) : null}
    </View>
  );
}

export const MovimientoHistorial = memo(MovimientoHistorialComponent);

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
    // Ademas del tachado, la tarjeta entera se apaga; el chip lo dice con palabras.
    anulado: { opacity: 0.6 },
    encabezado: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    icono: {
      alignItems: 'center',
      justifyContent: 'center',
      width: theme.spacing.xl,
      height: theme.spacing.xl,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    // `flex: 1` para que un texto largo se recorte en vez de empujar el monto.
    flex: { flex: 1 },
    articulos: {
      gap: theme.spacing.xs,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    articulo: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    subtotal: { minWidth: 84, textAlign: 'right' },
    linea: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    tachado: { textDecorationLine: 'line-through' },
  });
