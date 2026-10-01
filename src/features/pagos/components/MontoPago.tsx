import { useMemo } from 'react';
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { conPuntos, formatearMoneda, soloDigitos } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

interface MontoPagoProps {
  /** Solo digitos: lo que guarda el formulario. */
  valor: string;
  onCambiar: (digitos: string) => void;
  onBlur?: () => void;
  /** Lo maximo que se puede cobrar: la deuda total o el saldo de la factura. */
  deuda: number;
  quedaDebiendo: number;
  /** El atajo "Paga todo": el pago completo en un toque. */
  onTodo: () => void;
  error?: string;
}

/**
 * El monto, en grande, con lo que debe y lo que le queda en la misma tarjeta.
 *
 * Es lo unico que hay que escribir si o si, asi que es lo que manda en la
 * pantalla. La barra dice de un vistazo cuanto de la deuda cubre lo que deja:
 * se llena mientras se escribe y se pone en verde si salda todo.
 */
export function MontoPago({
  valor,
  onCambiar,
  onBlur,
  deuda,
  quedaDebiendo,
  onTodo,
  error,
}: MontoPagoProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const monto = Number(valor) || 0;
  const cubre = deuda > 0 ? Math.min(1, monto / deuda) : 0;
  const salda = monto > 0 && quedaDebiendo === 0 && !error;
  const pagaTodo = monto === deuda;
  const sobra = Math.max(0, monto - deuda);

  return (
    <View style={[styles.tarjeta, error ? styles.tarjetaError : null]}>
      <Text variant="caption" tone="muted">
        ¿Cuánto deja?
      </Text>

      <View style={styles.fila}>
        <Text variant="title" weight="medium" family="text" tone="muted">
          $
        </Text>
        <TextInput
          value={conPuntos(valor)}
          // Los puntos son de adorno: al formulario llegan solo los digitos.
          onChangeText={(texto) => onCambiar(soloDigitos(texto))}
          onBlur={onBlur}
          placeholder="0"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="number-pad"
          returnKeyType="done"
          // Es lo unico obligatorio: el foco arranca aca.
          autoFocus
          maxLength={13}
          accessibilityLabel="Cuánto deja"
          style={styles.input}
        />
      </View>

      {/*
        El atajo dice QUE hace y CUANTO pone: "Todo" solo no se entendia. Queda
        siempre a la vista para que la tarjeta no salte; cuando el monto ya es
        la deuda entera se marca elegido, con el tilde.
      */}
      <Pressable
        onPress={onTodo}
        disabled={pagaTodo}
        hitSlop={theme.spacing.xs}
        accessibilityRole="button"
        accessibilityState={{ selected: pagaTodo }}
        accessibilityLabel={`Paga todo lo que debe: ${formatearMoneda(deuda)}`}
        style={({ pressed }) => [
          styles.todo,
          pagaTodo && styles.todoElegido,
          pressed && styles.presionado,
        ]}
      >
        {pagaTodo ? (
          <Check size={theme.typography.size.body} color={theme.colors.onPrimary} strokeWidth={3} />
        ) : null}
        <Text variant="caption" weight="bold" tone={pagaTodo ? 'onPrimary' : 'primary'}>
          Paga todo · {formatearMoneda(deuda)}
        </Text>
      </Pressable>

      <View
        style={styles.barra}
        accessibilityRole="progressbar"
        accessibilityLabel={`Cubre el ${Math.round(cubre * 100)}% de lo que debe`}
      >
        <View
          style={[
            styles.relleno,
            { width: `${cubre * 100}%` },
            salda && styles.rellenoSalda,
            error ? styles.rellenoError : null,
          ]}
        />
      </View>

      <View style={styles.pie}>
        <Text variant="caption" tone="muted">
          Debe {formatearMoneda(deuda)}
        </Text>
        {/* Si se pasa, "Queda $0" se leeria como que esta todo bien: se dice
            por cuanto se pasa, en rojo. */}
        <Text
          variant="body"
          weight="bold"
          family="text"
          tone={sobra > 0 ? 'error' : salda ? 'success' : 'default'}
        >
          {sobra > 0
            ? `Sobran ${formatearMoneda(sobra)}`
            : salda
              ? 'Queda al día'
              : `Queda ${formatearMoneda(quedaDebiendo)}`}
        </Text>
      </View>

      {error ? (
        <Text variant="caption" tone="error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

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
    tarjetaError: { borderColor: theme.colors.error },
    fila: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    input: {
      flex: 1,
      padding: 0,
      // El monto es EL dato de la pantalla: un escalon por encima del titulo
      // mas grande del theme, derivado de el para no inventar un tamano suelto.
      fontSize: theme.typography.size.heading * 1.5,
      ...theme.typography.family.text.bold,
      color: theme.colors.text,
      includeFontPadding: false,
    },
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
    presionado: { opacity: 0.5 },
    barra: {
      height: theme.spacing.sm,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.border,
      overflow: 'hidden',
    },
    relleno: { height: '100%', backgroundColor: theme.colors.primary },
    rellenoSalda: { backgroundColor: theme.colors.success },
    rellenoError: { backgroundColor: theme.colors.error },
    pie: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
  });
