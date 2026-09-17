import { Minus, TrendingDown, TrendingUp } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface VariacionProps {
  /** El cambio. `null` cuando no hay contra que comparar: se muestra `—`. */
  valor: number | null;
  /** Como se lee el numero, ya formateado ("12 %", "$ 401.500 más"). */
  texto: (valor: number) => string;
  /**
   * Si crecer es bueno. Vender y cobrar mas, si; que la libreta crezca, no.
   * De eso depende el color.
   */
  subirEsBueno?: boolean;
}

/**
 * El cambio contra el período anterior, con flecha y color: verde lo bueno,
 * rojo lo malo, gris cuando no cambió.
 *
 * La flecha no alcanza sola —hay quien no distingue el verde del rojo—, por eso
 * el texto dice siempre qué pasó.
 */
export function Variacion({ valor, texto, subirEsBueno = true }: VariacionProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  if (valor === null) {
    return (
      <Text variant="caption" tone="muted">
        Sin comparación con el mes anterior
      </Text>
    );
  }

  const sinCambio = valor === 0;
  const bueno = subirEsBueno ? valor > 0 : valor < 0;
  const Icono = sinCambio ? Minus : valor > 0 ? TrendingUp : TrendingDown;
  const color = sinCambio
    ? theme.colors.textMuted
    : bueno
      ? theme.colors.success
      : theme.colors.error;

  return (
    <View style={styles.fila}>
      <Icono size={16} color={color} />
      <Text
        variant="caption"
        weight="bold"
        tone={sinCambio ? 'muted' : bueno ? 'success' : 'error'}
      >
        {texto(valor)}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  });
