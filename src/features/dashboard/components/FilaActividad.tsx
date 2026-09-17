import { Receipt, Wallet } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { nombreMetodo } from '@/features/pagos/formato';
import { Text } from '@/shared/ui/atoms';
import { formatearFechaCorta, formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { Actividad } from '../types';

interface FilaActividadProps {
  actividad: Actividad;
}

/**
 * Lo ultimo que se cargo: una compra o un pago, con quien lo cargo.
 *
 * Con dos duenos en el mostrador, sirve para ver que hizo el otro sin
 * preguntarle.
 */
function FilaActividadComponent({ actividad }: FilaActividadProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const esCompra = actividad.tipo === 'compra';
  const Icono = esCompra ? Receipt : Wallet;
  const titulo = esCompra ? 'Compra' : `Pago · ${nombreMetodo(actividad.metodoPago)}`;
  const contexto = [
    formatearFechaCorta(actividad.fecha),
    actividad.cliente?.nombre ?? 'Cliente eliminado',
    actividad.registradoPor ? `cargó ${actividad.registradoPor.nombre}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.fila}>
      <View style={styles.icono}>
        <Icono size={16} color={esCompra ? theme.colors.primary : theme.colors.success} />
      </View>
      <View style={styles.datos}>
        <Text variant="body" weight="medium" numberOfLines={1}>
          {titulo}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {contexto}
        </Text>
      </View>
      <Text variant="body" weight="bold" family="text" tone={esCompra ? 'default' : 'success'}>
        {formatearMoneda(actividad.monto)}
      </Text>
    </View>
  );
}

export const FilaActividad = memo(FilaActividadComponent);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
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
    // `flex: 1` para que un nombre largo se recorte en vez de empujar el monto.
    datos: { flex: 1, gap: 2 },
  });
