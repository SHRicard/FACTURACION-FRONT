import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { useController, type Control } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { Button, Modal, SelectorFecha, Text } from '@/shared/ui/atoms';
import { formatearFecha, hoyEnArgentina } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { TicketForm } from '../types';

interface CampoVencimientoProps {
  control: Control<TicketForm>;
  /** Cuando paga el cliente, "del 1 al 10": lo que vale si no se elige nada. */
  ventanaPago: string;
}

/**
 * La fecha que el cliente promete volver a pagar ("vuelvo el 10 de abril").
 *
 * Solo va en el primer ticket de la factura: despues la fecha ya quedo fijada y
 * se cambia desde la factura. Es opcional —sin elegir nada, vence segun su
 * ventana de pago—, asi que va plegada: el calendario se abre recien cuando
 * hace falta y no alarga el caso normal, que es cargar y guardar.
 */
export function CampoVencimiento({ control, ventanaPago }: CampoVencimientoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { field } = useController({ control, name: 'venceEl' });
  const [abierto, setAbierto] = useState(false);

  // `aaaa-mm-dd` es ISO valido: `formatearFecha` lo lee sin correr el dia.
  const elegida = field.value ? formatearFecha(field.value) : null;

  const elegir = (fecha: string) => {
    field.onChange(fecha);
    setAbierto(false);
  };

  return (
    <View style={styles.campo}>
      <Text variant="caption" tone="muted">
        Vencimiento
      </Text>
      <View style={styles.fila}>
        <Text variant="body" weight={elegida ? 'medium' : 'regular'} style={styles.texto}>
          {elegida ? `Vence el ${elegida}` : `Según su ventana de pago, ${ventanaPago}`}
        </Text>
        <Button
          label={elegida ? 'Cambiar' : 'Elegir fecha'}
          variant="ghost"
          size="sm"
          onPress={() => setAbierto(true)}
          leftIcon={<CalendarDays size={16} color={theme.colors.primary} />}
          accessibilityLabel={
            elegida ? 'Cambiar la fecha de vencimiento' : 'Elegir la fecha de vencimiento'
          }
        />
      </View>

      <Modal
        visible={abierto}
        onClose={() => setAbierto(false)}
        titulo="¿Cuándo vuelve a pagar?"
        descripcion="La fecha que acordaste con el cliente. Vence al final de ese día."
        acciones={
          field.value ? (
            <Button label="Usar su ventana de pago" variant="ghost" onPress={() => elegir('')} />
          ) : undefined
        }
      >
        <SelectorFecha
          valor={field.value || null}
          onCambiar={elegir}
          minimo={hoyEnArgentina()}
          accessibilityLabel="Fecha de vencimiento"
        />
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    campo: { gap: theme.spacing.xs },
    fila: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    texto: { flex: 1 },
  });
