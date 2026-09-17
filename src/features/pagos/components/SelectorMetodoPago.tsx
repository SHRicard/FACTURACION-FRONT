import { Banknote, Landmark, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { NOMBRE_METODO } from '../formato';
import { METODOS_PAGO } from '../schemas';
import type { MetodoPago } from '../types';

const ICONO_METODO: Record<MetodoPago, LucideIcon> = {
  efectivo: Banknote,
  transferencia: Landmark,
};

interface SelectorMetodoPagoProps {
  valor: MetodoPago;
  onCambiar: (metodo: MetodoPago) => void;
}

/**
 * Como pago: un control partido en dos mitades iguales, una sola elegida.
 * Son dos opciones fijas, asi que ocupan todo el ancho y se tocan sin apuntar.
 * Arranca en efectivo, que es lo que pasa casi siempre en el mostrador.
 */
export function SelectorMetodoPago({ valor, onCambiar }: SelectorMetodoPagoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.riel} accessibilityRole="radiogroup">
      {METODOS_PAGO.map((metodo) => {
        const activo = metodo === valor;
        const Icono = ICONO_METODO[metodo];

        return (
          <Pressable
            key={metodo}
            onPress={() => onCambiar(metodo)}
            style={({ pressed }) => [
              styles.opcion,
              activo && styles.activo,
              pressed && !activo && styles.presionado,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={NOMBRE_METODO[metodo]}
          >
            <Icono
              size={theme.typography.size.body + 2}
              color={activo ? theme.colors.onPrimary : theme.colors.textMuted}
              strokeWidth={2}
            />
            <Text weight={activo ? 'bold' : 'medium'} tone={activo ? 'onPrimary' : 'muted'}>
              {NOMBRE_METODO[metodo]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    riel: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      padding: theme.spacing.xs,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    opcion: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      minHeight: 44,
      borderRadius: theme.radius.md,
    },
    activo: { backgroundColor: theme.colors.primary },
    presionado: { backgroundColor: theme.colors.border },
  });
