import { Controller, type Control } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { Input, Text } from '@/shared/ui/atoms';
import { formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { TicketForm } from '../types';

interface ResumenTicketProps {
  control: Control<TicketForm>;
  total: number;
  dejaAhora: number;
  quedaDebiendo: number;
  onPagarTodo: () => void;
}

/**
 * El pie del ticket: cuanto suma, cuanto deja y cuanto queda debiendo.
 *
 * "Queda debiendo" va en grande porque es el numero del negocio: es lo unico
 * que suma a la cuenta del cliente.
 */
export function ResumenTicket({
  control,
  total,
  dejaAhora,
  quedaDebiendo,
  onPagarTodo,
}: ResumenTicketProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  // El atajo aparece solo cuando haria algo: sin total que igualar, o con el
  // campo ya en el total, seria un boton muerto ocupando lugar.
  const mostrarAtajo = total > 0 && dejaAhora !== total;

  return (
    <View style={styles.resumen}>
      <View style={styles.fila}>
        <Text variant="body" tone="muted">
          Total
        </Text>
        <Text variant="title" weight="bold" family="text">
          {formatearMoneda(total)}
        </Text>
      </View>

      {/*
        El campo se arma a mano y no con `CampoControlado` porque necesita la
        etiqueta compartiendo renglon con el atajo. Antes eso era un boton al
        costado: dos recuadros peleando al lado de un campo que ya tiene el suyo,
        y encima de alturas distintas.
      */}
      <Controller
        control={control}
        name="pagado"
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
          <View style={styles.campo}>
            <View style={styles.etiqueta}>
              <Text variant="caption" tone="muted">
                Deja ahora
              </Text>
              {mostrarAtajo ? (
                <Pressable
                  onPress={onPagarTodo}
                  hitSlop={theme.spacing.sm}
                  accessibilityRole="button"
                  accessibilityLabel={`Pagó todo: ${formatearMoneda(total)}`}
                  style={({ pressed }) => (pressed ? styles.presionado : undefined)}
                >
                  <Text variant="caption" weight="bold" tone="primary">
                    Pagó todo
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              hasError={Boolean(error)}
              placeholder="0"
              keyboardType="number-pad"
              returnKeyType="done"
              accessibilityLabel="Cuánto deja ahora"
              // El signo adentro del campo evita tener que escribirlo y deja
              // claro que lo que va ahi es plata, no una cantidad.
              leftSlot={
                <Text variant="body" tone="muted">
                  $
                </Text>
              }
            />

            {error ? (
              <Text variant="caption" tone="error">
                {error.message}
              </Text>
            ) : null}
          </View>
        )}
      />

      <View style={styles.deuda}>
        <Text variant="body" tone="muted">
          Queda debiendo
        </Text>
        <Text
          variant="heading"
          weight="bold"
          family="text"
          tone={quedaDebiendo > 0 ? 'default' : 'success'}
        >
          {formatearMoneda(quedaDebiendo)}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    resumen: {
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
    },
    fila: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    campo: { gap: theme.spacing.xs },
    // La etiqueta a la izquierda y el atajo a la derecha, en el mismo renglon:
    // el atajo no ocupa alto propio ni empuja nada.
    etiqueta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      minHeight: 20,
    },
    presionado: { opacity: 0.5 },
    deuda: {
      gap: 2,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm,
    },
  });
