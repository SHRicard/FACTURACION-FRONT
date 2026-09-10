import { ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/shared/ui/atoms';
import { formatearFechaCorta, formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { ItemEnFactura, TicketEnFactura } from '../types';

interface BloqueTicketProps {
  ticket: TicketEnFactura;
  /** Sin esto el bloque no es tocable: en una factura cerrada no hay que corregir. */
  onPress?: (id: string) => void;
}

/** Un renglon del ticket: que se llevo, de que tipo, cuantos y cuanto sumo. */
function Renglon({ item, anulado }: { item: ItemEnFactura; anulado: boolean }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  // El talle y la especie se juntan en una linea: en un telefono no entra una
  // columna por dato.
  const detalle = [item.talle, item.especieNombre].filter(Boolean).join(' · ');
  // El tachado es de TEXTO, no de vista: hay que ponerlo en cada Text.
  const tachado = anulado ? styles.tachado : undefined;

  return (
    <View style={styles.renglon}>
      <View style={styles.renglonDatos}>
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
}

/**
 * Un ticket dentro de la factura, con sus renglones y su faltante.
 *
 * Los anulados NO desaparecen: quedan tachados y en gris, con el motivo. Es una
 * libreta —lo que se escribio mal se cruza con una raya— y ademas un ticket
 * borrado de verdad se llevaria la explicacion de por que la cuenta cambio de
 * un dia para el otro.
 */
function BloqueTicketComponent({ ticket, onPress }: BloqueTicketProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const tocable = Boolean(onPress) && !ticket.anulado;
  const fecha = formatearFechaCorta(ticket.fecha) ?? '';

  const contenido = (
    <>
      <View style={styles.encabezado}>
        <Text variant="caption" tone="muted">
          {fecha}
        </Text>
        {ticket.anulado ? <Badge label="Anulado" tone="neutral" /> : null}
        <View style={styles.espacio} />
        {tocable ? <ChevronRight size={18} color={theme.colors.textMuted} /> : null}
      </View>

      <View style={styles.items}>
        {ticket.items.map((item, indice) => (
          // Los items no tienen id propio: son parte del ticket, y el indice es
          // estable porque la lista no se reordena ni se filtra.
          <Renglon key={`${ticket.id}-${indice}`} item={item} anulado={ticket.anulado} />
        ))}
      </View>

      <View style={styles.totales}>
        <Text variant="caption" tone="muted">
          Total {formatearMoneda(ticket.total)} · dejó {formatearMoneda(ticket.pagado)}
        </Text>
        <Text
          variant="body"
          weight="bold"
          family="text"
          tone={ticket.anulado ? 'muted' : 'default'}
        >
          {formatearMoneda(ticket.faltante)}
        </Text>
      </View>

      {/* El motivo explica, meses despues, por que la cuenta cambio. */}
      {ticket.anulado && ticket.motivoAnulacion ? (
        <Text variant="caption" tone="muted">
          Motivo: {ticket.motivoAnulacion}
        </Text>
      ) : null}
    </>
  );

  if (!tocable) {
    return <View style={[styles.bloque, ticket.anulado && styles.anulado]}>{contenido}</View>;
  }

  return (
    <Pressable
      onPress={() => onPress?.(ticket.id)}
      style={({ pressed }) => [styles.bloque, pressed && styles.presionado]}
      accessibilityRole="button"
      accessibilityLabel={`Ticket del ${fecha}, ${formatearMoneda(ticket.total)}`}
      accessibilityHint="Corregir o anular"
    >
      {contenido}
    </Pressable>
  );
}

export const BloqueTicket = memo(BloqueTicketComponent);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bloque: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    // Ademas del tachado, el bloque entero se apaga: el chip "Anulado" es lo
    // que lo dice con palabras, para quien no percibe el gris.
    anulado: { opacity: 0.6 },
    presionado: { opacity: 0.7 },
    encabezado: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    espacio: { flex: 1 },
    items: { gap: theme.spacing.xs },
    tachado: { textDecorationLine: 'line-through' },
    renglon: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    renglonDatos: { flex: 1 },
    subtotal: { minWidth: 84, textAlign: 'right' },
    totales: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm,
    },
  });
