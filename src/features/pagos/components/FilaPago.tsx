import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/shared/ui/atoms';
import { formatearFechaCorta, formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { fueRepartido, nombreMetodo, quienCobro, textoRecibo } from '../formato';
import type { Pago } from '../types';

interface FilaPagoProps {
  pago: Pago;
  /** Sin esto el renglon no es tocable (la factura esta anulada). */
  onAnular?: (pago: Pago) => void;
}

/**
 * Un pago dentro de la factura: cuando, como, cuanto y el recibo.
 *
 * Los anulados NO desaparecen: quedan tachados y en gris, con el motivo, igual
 * que los tickets. Los pagos viejos sin recibo (`tipo: null`) se muestran sin el
 * chip ni los saldos, en vez de inventarles datos.
 */
function FilaPagoComponent({ pago, onAnular }: FilaPagoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const tocable = Boolean(onAnular) && !pago.anulado;
  // El tachado es de TEXTO: va en cada Text, no en la vista contenedora.
  const tachado = pago.anulado ? styles.tachado : undefined;
  const recibo = textoRecibo(pago);
  const cobro = quienCobro(pago);
  const fecha = formatearFechaCorta(pago.fecha) ?? '';

  const extras = [
    fueRepartido(pago) && pago.montoEntrega != null
      ? `de una entrega de ${formatearMoneda(pago.montoEntrega)}`
      : null,
    pago.nota ? `"${pago.nota}"` : null,
    cobro ? `cobró ${cobro}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const contenido = (
    <>
      <View style={styles.encabezado}>
        <Text variant="caption" tone="muted" style={tachado}>
          {fecha}
        </Text>
        <Text variant="body" weight="medium" numberOfLines={1} style={[styles.metodo, tachado]}>
          {nombreMetodo(pago.metodoPago)}
        </Text>
        <Text
          variant="body"
          weight="bold"
          family="text"
          tone={pago.anulado ? 'muted' : 'success'}
          style={tachado}
        >
          {formatearMoneda(pago.monto)}
        </Text>
      </View>

      {pago.anulado ? (
        <View style={styles.linea}>
          {/* La palabra ademas del gris: el tachado solo no lo lee quien no lo ve. */}
          <Badge label="Anulado" tone="neutral" />
          <Text variant="caption" tone="muted" numberOfLines={2} style={styles.flex}>
            {pago.motivoAnulacion ? `motivo: ${pago.motivoAnulacion}` : 'sin motivo'}
          </Text>
        </View>
      ) : (
        <>
          {pago.tipo || recibo ? (
            <View style={styles.linea}>
              {pago.tipo ? (
                <Badge label={pago.tipo} tone={pago.tipo === 'completo' ? 'success' : 'primary'} />
              ) : null}
              {recibo ? (
                <Text variant="caption" tone="muted" style={styles.flex}>
                  {recibo}
                </Text>
              ) : null}
            </View>
          ) : null}
          {extras ? (
            <Text variant="caption" tone="muted" numberOfLines={2}>
              {extras}
            </Text>
          ) : null}
        </>
      )}
    </>
  );

  if (!tocable) {
    return <View style={[styles.fila, pago.anulado && styles.anulado]}>{contenido}</View>;
  }

  return (
    <Pressable
      onPress={() => onAnular?.(pago)}
      style={({ pressed }) => [styles.fila, pressed && styles.presionado]}
      accessibilityRole="button"
      accessibilityLabel={`Pago del ${fecha}, ${nombreMetodo(pago.metodoPago)}, ${formatearMoneda(pago.monto)}`}
      accessibilityHint="Anular el pago"
    >
      {contenido}
    </Pressable>
  );
}

export const FilaPago = memo(FilaPagoComponent);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    anulado: { opacity: 0.6 },
    presionado: { opacity: 0.7 },
    encabezado: { flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing.sm },
    // `flex: 1` para que un metodo largo se recorte y no empuje el monto.
    metodo: { flex: 1 },
    linea: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    flex: { flex: 1 },
    tachado: { textDecorationLine: 'line-through' },
  });
