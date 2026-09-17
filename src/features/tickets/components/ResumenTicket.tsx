import { Check } from 'lucide-react-native';
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
 * Tiene la misma forma que la tarjeta del pago —monto, atajo en pildora, y lo
 * que queda abajo— para que las dos pantallas de plata se lean igual.
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

  const pagoTodo = total > 0 && dejaAhora === total;
  const alDia = total > 0 && quedaDebiendo === 0;

  return (
    <View style={styles.resumen}>
      <View style={styles.fila}>
        <Text variant="body" tone="muted">
          Total del ticket
        </Text>
        <Text variant="title" weight="bold" family="text">
          {formatearMoneda(total)}
        </Text>
      </View>

      <Controller
        control={control}
        name="pagado"
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
          <View style={styles.campo}>
            <Text variant="caption" tone="muted">
              Deja ahora
            </Text>
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              hasError={Boolean(error)}
              placeholder="0"
              monto
              returnKeyType="done"
              accessibilityLabel="Cuánto deja ahora"
            />

            {/*
              El atajo dice que hace y cuanto pone. Queda siempre a la vista para
              que la tarjeta no salte; con el total ya puesto se marca elegido.
            */}
            <Pressable
              onPress={onPagarTodo}
              disabled={total === 0 || pagoTodo}
              hitSlop={theme.spacing.xs}
              accessibilityRole="button"
              accessibilityState={{ selected: pagoTodo, disabled: total === 0 }}
              accessibilityLabel={`Pagó todo: ${formatearMoneda(total)}`}
              style={({ pressed }) => [
                styles.todo,
                pagoTodo && styles.todoElegido,
                total === 0 && styles.todoApagado,
                pressed && styles.presionado,
              ]}
            >
              {pagoTodo ? (
                <Check
                  size={theme.typography.size.body}
                  color={theme.colors.onPrimary}
                  strokeWidth={3}
                />
              ) : null}
              <Text variant="caption" weight="bold" tone={pagoTodo ? 'onPrimary' : 'primary'}>
                Pagó todo · {formatearMoneda(total)}
              </Text>
            </Pressable>

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
        <Text variant="heading" weight="bold" family="text" tone={alDia ? 'success' : 'default'}>
          {alDia ? 'Nada' : formatearMoneda(quedaDebiendo)}
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
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    fila: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    campo: { gap: theme.spacing.sm },
    todo: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs + 2,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    todoElegido: { backgroundColor: theme.colors.primary },
    todoApagado: { opacity: 0.4 },
    presionado: { opacity: 0.5 },
    deuda: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.md,
    },
  });
