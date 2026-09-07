import { StyleSheet, View } from 'react-native';

import { Badge, Text, type BadgeTone } from '@/shared/ui/atoms';
import { formatearFecha, formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { FacturaAbierta } from '../types';

/**
 * De `estadoVisible` al color del chip.
 *
 * Se mapea por string y no por el `estado` crudo porque "vencida" y "sin deuda"
 * solo existen del lado visible. Lo que no este en la tabla cae en neutral: es
 * preferible un chip gris con el texto correcto que romper la pantalla.
 */
const TONO_POR_ESTADO: Record<string, BadgeTone> = {
  abierta: 'primary',
  vencida: 'error',
  cerrada: 'warning',
  'sin deuda': 'neutral',
  pagada: 'success',
  anulada: 'neutral',
};

/** Como se lee el plazo que queda. Los negativos ya no son "faltan". */
function textoVencimiento(factura: FacturaAbierta): string {
  const fecha = formatearFecha(factura.venceEl) ?? 'sin fecha';
  if (factura.vencida) return `Vencio el ${fecha}`;
  if (factura.diasParaVencer === 0) return `Vence hoy, ${fecha}`;
  if (factura.diasParaVencer === 1) return `Vence manana, ${fecha}`;
  return `Vence en ${factura.diasParaVencer} dias, el ${fecha}`;
}

/** La factura del periodo en curso: cuanto debe y hasta cuando tiene tiempo. */
export function TarjetaFacturaAbierta({ factura }: { factura: FacturaAbierta }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.tarjeta, factura.vencida && styles.vencida]}>
      <View style={styles.encabezado}>
        <Text variant="caption" tone="muted">
          Factura del periodo
        </Text>
        <Badge
          label={factura.estadoVisible}
          tone={TONO_POR_ESTADO[factura.estadoVisible] ?? 'neutral'}
        />
      </View>

      <Text variant="title" weight="bold" family="text">
        {formatearMoneda(factura.saldo)}
      </Text>

      <Text variant="body" tone={factura.vencida ? 'error' : 'muted'}>
        {textoVencimiento(factura)}
      </Text>

      <Text variant="caption" tone="muted">
        {factura.cantidadTickets === 1
          ? '1 ticket cargado'
          : `${factura.cantidadTickets} tickets cargados`}
      </Text>
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
    // El borde de color acompana al chip y al texto, no los reemplaza.
    vencida: { borderColor: theme.colors.error },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
  });
