import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { FacturaDetalle } from '../types';

/** Una linea del resumen. `resta` la muestra con el signo menos adelante. */
function Linea({ etiqueta, monto, resta }: { etiqueta: string; monto: number; resta?: boolean }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.linea}>
      <Text variant="body" tone="muted">
        {etiqueta}
      </Text>
      <Text variant="body" family="text">
        {resta ? '− ' : ''}
        {formatearMoneda(monto)}
      </Text>
    </View>
  );
}

/**
 * Los cinco totales del periodo, en el orden en que cierran solos.
 *
 * Se leen de arriba para abajo como una cuenta: mercaderia, menos lo que fue
 * dejando, menos los pagos a cuenta, igual al saldo. `saldo` es el numero
 * grande de la pantalla — es lo que el cliente debe.
 */
export function ResumenTotales({ factura }: { factura: FacturaDetalle['factura'] }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.resumen}>
      <Linea etiqueta="Mercadería" monto={factura.totalMercaderia} />
      <Linea etiqueta="Dejó en el momento" monto={factura.totalPagadoEnTickets} resta />
      <Linea etiqueta="Pagos a cuenta" monto={factura.totalPagos} resta />

      <View style={styles.saldo}>
        <Text variant="body" weight="bold">
          SALDO
        </Text>
        <Text
          variant="heading"
          weight="bold"
          family="text"
          tone={factura.saldo > 0 ? 'default' : 'success'}
        >
          {formatearMoneda(factura.saldo)}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    resumen: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
    },
    linea: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    saldo: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      // La doble linea del papel: es lo que separa la cuenta del resultado.
      borderTopWidth: 2,
      borderTopColor: theme.colors.border,
      marginTop: theme.spacing.xs,
      paddingTop: theme.spacing.sm,
    },
  });
