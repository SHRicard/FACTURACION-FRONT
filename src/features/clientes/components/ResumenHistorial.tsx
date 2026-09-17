import { MessageCircle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Badge, Button, Text, type BadgeTone, type TextTone } from '@/shared/ui/atoms';
import {
  contar,
  formatearCumplimiento,
  formatearFechaCorta,
  formatearMoneda,
  haceDias,
  textoDias,
  tonoCumplimiento,
} from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { Cliente, ResumenHistorial as Resumen } from '../types';

/** El color del numero, con el mismo significado que tendria el chip. */
const TONO_TEXTO: Record<BadgeTone, TextTone> = {
  neutral: 'muted',
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

interface DatoProps {
  etiqueta: string;
  valor: string;
  /** Una linea de contexto debajo del numero. */
  detalle?: string;
  tono?: TextTone;
}

/** Un numero del resumen, de a dos por fila. */
function Dato({ etiqueta, valor, detalle, tono = 'default' }: DatoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View
      style={styles.dato}
      accessible
      accessibilityLabel={[`${etiqueta}: ${valor}`, detalle].filter(Boolean).join('. ')}
    >
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {etiqueta}
      </Text>
      <Text
        variant="body"
        weight="bold"
        family="text"
        tone={tono}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {valor}
      </Text>
      {detalle ? (
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {detalle}
        </Text>
      ) : null}
    </View>
  );
}

/** Cada cuanto vuelve, en una frase. */
function textoVisitas(resumen: Resumen): string {
  if (resumen.cantidadTickets === 0) return 'Todavía no compró';
  if (resumen.diasEntreCompras === null) return 'Vino una sola vez';
  return `Vuelve cada ${textoDias(resumen.diasEntreCompras)}`;
}

interface ResumenHistorialProps {
  cliente: Cliente;
  resumen: Resumen;
  /** Sin esto no hay boton: su telefono no se entiende como celular. */
  onWhatsApp?: () => void;
}

/**
 * Lo de arriba del historial: cuanto debe hoy y como viene, y los numeros de
 * toda su historia con la marca. Es lo que se mira antes de decidir como
 * cobrarle, o si fiarle mas.
 */
export function ResumenHistorial({ cliente, resumen, onWhatsApp }: ResumenHistorialProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const superaLimite = cliente.limiteCredito > 0 && resumen.deuda > cliente.limiteCredito;
  const { cumplimiento } = resumen;
  const sinHistorial = cumplimiento.evaluadas === 0 || cumplimiento.cumplimientoPromedio === null;
  const clienteDesde = formatearFechaCorta(resumen.primeraCompra ?? cliente.createdAt);

  return (
    <>
      <View style={[styles.deuda, resumen.moroso && styles.morosa]}>
        <Text variant="caption" tone="muted">
          Debe hoy
        </Text>
        <Text
          variant="heading"
          weight="bold"
          family="text"
          tone={resumen.moroso ? 'error' : resumen.deuda > 0 ? 'default' : 'muted'}
        >
          {formatearMoneda(resumen.deuda)}
        </Text>
        <View style={styles.chips}>
          {resumen.moroso ? (
            <Badge
              label={
                resumen.diasDeAtraso === null
                  ? 'Moroso'
                  : `Moroso · ${textoDias(resumen.diasDeAtraso)} de atraso`
              }
              tone="error"
            />
          ) : resumen.deuda > 0 ? (
            <Badge label="Debe, sin vencer" tone="primary" />
          ) : (
            <Badge label="Al día" tone="success" />
          )}
          {superaLimite ? <Badge label="Supera su límite" tone="warning" /> : null}
        </View>
        <Text variant="caption" tone="muted">
          {cliente.limiteCredito > 0
            ? `Límite de crédito ${formatearMoneda(cliente.limiteCredito)}`
            : 'Sin límite de crédito'}
        </Text>
        {onWhatsApp ? (
          <Button
            label="Escribirle por WhatsApp"
            variant="secondary"
            onPress={onWhatsApp}
            leftIcon={<MessageCircle size={16} color={theme.colors.primary} />}
            fullWidth
            style={styles.whatsapp}
          />
        ) : null}
      </View>

      <View style={styles.datos}>
        <Dato
          etiqueta="Compró en total"
          valor={formatearMoneda(resumen.totalComprado)}
          detalle={[
            contar(resumen.cantidadTickets, 'ticket', 'tickets'),
            resumen.ticketPromedio === null
              ? null
              : `promedio ${formatearMoneda(resumen.ticketPromedio)}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        />
        <Dato
          etiqueta="Pagó a cuenta"
          valor={formatearMoneda(resumen.totalPagos)}
          detalle={contar(resumen.cantidadPagos, 'pago', 'pagos')}
        />
        <Dato
          etiqueta="Se llevó fiado"
          valor={formatearMoneda(resumen.totalFiado)}
          detalle={`Dejó ${formatearMoneda(resumen.totalPagadoAlComprar)} al comprar`}
        />
        <Dato
          etiqueta="Cumplimiento"
          valor={sinHistorial ? '—' : formatearCumplimiento(cumplimiento.cumplimientoPromedio)}
          tono={
            sinHistorial ? 'muted' : TONO_TEXTO[tonoCumplimiento(cumplimiento.cumplimientoPromedio)]
          }
          detalle={
            sinHistorial
              ? 'Sin facturas para juzgar'
              : `De ${contar(cumplimiento.evaluadas, 'factura', 'facturas')}`
          }
        />
        <Dato
          etiqueta="Último pago"
          valor={resumen.ultimoPago ? formatearMoneda(resumen.ultimoPago.monto) : 'Nunca'}
          detalle={
            resumen.diasSinPagar === null ? 'Nunca pagó a cuenta' : haceDias(resumen.diasSinPagar)
          }
          tono={resumen.ultimoPago ? 'default' : 'muted'}
        />
        <Dato
          etiqueta="Última compra"
          valor={resumen.ultimaCompra ? formatearMoneda(resumen.ultimaCompra.total) : '—'}
          detalle={
            resumen.ultimaCompra
              ? `El ${formatearFechaCorta(resumen.ultimaCompra.fecha) ?? '—'}`
              : 'Nunca compró'
          }
        />
        <Dato
          etiqueta="Cliente desde"
          valor={clienteDesde ?? '—'}
          detalle={textoVisitas(resumen)}
        />
      </View>
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    deuda: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    // El borde acompana al chip de moroso, no lo reemplaza.
    morosa: { borderColor: theme.colors.error },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
    whatsapp: { marginTop: theme.spacing.sm },
    // Base del 45% y `flexGrow`: dos por fila, estirados a partes iguales.
    datos: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    dato: {
      flexBasis: '45%',
      flexGrow: 1,
      gap: 2,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  });
