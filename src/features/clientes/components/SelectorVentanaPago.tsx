import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { formatearVentanaPago } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

const DIA_MINIMO = 1;
const DIA_MAXIMO = 31;

interface SelectorVentanaPagoProps {
  desdeDia: number;
  hastaDia: number;
  /** Siempre llega el par completo: el control nunca deja un rango invalido. */
  onChange: (desdeDia: number, hastaDia: number) => void;
  error?: string;
}

function acotar(dia: number): number {
  return Math.min(Math.max(dia, DIA_MINIMO), DIA_MAXIMO);
}

/**
 * Elige la ventana de pago del cliente: los dias del mes en que paga.
 *
 * Es el campo mas importante del formulario — de aca sale el vencimiento de
 * todas sus facturas — asi que va con botones y no con un input libre: escribir
 * "1 al 10" a mano es donde se cuelan los errores.
 *
 * El control NO deja armar un rango invalido: subir el dia de inicio por encima
 * del de fin empuja el fin, y bajar el fin por debajo del inicio lo arrastra.
 * Asi la validacion de Zod es una red de seguridad, no la unica defensa.
 */
export function SelectorVentanaPago({
  desdeDia,
  hastaDia,
  onChange,
  error,
}: SelectorVentanaPagoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const cambiarDesde = (dia: number) => {
    const nuevo = acotar(dia);
    onChange(nuevo, Math.max(nuevo, hastaDia));
  };

  const cambiarHasta = (dia: number) => {
    const nuevo = acotar(dia);
    onChange(Math.min(desdeDia, nuevo), nuevo);
  };

  return (
    <View style={styles.bloque}>
      <View style={styles.encabezado}>
        <Text variant="body" weight="medium">
          Ventana de pago
        </Text>
        <Text variant="caption" tone="muted">
          Los dias del mes en que este cliente paga. De aca sale el vencimiento de sus facturas.
        </Text>
      </View>

      <View style={styles.controles}>
        <Contador
          etiqueta="Desde el dia"
          valor={desdeDia}
          onCambiar={cambiarDesde}
          styles={styles}
          theme={theme}
        />
        <Contador
          etiqueta="Hasta el dia"
          valor={hastaDia}
          onCambiar={cambiarHasta}
          styles={styles}
          theme={theme}
        />
      </View>

      {error ? (
        <Text variant="caption" tone="error">
          {error}
        </Text>
      ) : (
        <Text variant="caption" tone="muted">
          Paga {formatearVentanaPago(desdeDia, hastaDia)} de cada mes.
        </Text>
      )}
    </View>
  );
}

interface ContadorProps {
  etiqueta: string;
  valor: number;
  onCambiar: (dia: number) => void;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
}

/** Un dia del mes, con menos y mas. Los topes apagan el boton que no aplica. */
function Contador({ etiqueta, valor, onCambiar, styles, theme }: ContadorProps) {
  const enMinimo = valor <= DIA_MINIMO;
  const enMaximo = valor >= DIA_MAXIMO;

  return (
    <View style={styles.contador}>
      <Text variant="caption" tone="muted">
        {etiqueta}
      </Text>
      <View style={styles.stepper}>
        <Pressable
          onPress={() => onCambiar(valor - 1)}
          disabled={enMinimo}
          style={({ pressed }) => [
            styles.boton,
            enMinimo && styles.botonApagado,
            pressed && !enMinimo && styles.presionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${etiqueta}: restar uno`}
          accessibilityState={{ disabled: enMinimo }}
        >
          <Minus size={18} color={enMinimo ? theme.colors.textMuted : theme.colors.text} />
        </Pressable>

        <Text variant="title" weight="bold" family="text" style={styles.numero}>
          {valor}
        </Text>

        <Pressable
          onPress={() => onCambiar(valor + 1)}
          disabled={enMaximo}
          style={({ pressed }) => [
            styles.boton,
            enMaximo && styles.botonApagado,
            pressed && !enMaximo && styles.presionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${etiqueta}: sumar uno`}
          accessibilityState={{ disabled: enMaximo }}
        >
          <Plus size={18} color={enMaximo ? theme.colors.textMuted : theme.colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bloque: { gap: theme.spacing.sm },
    encabezado: { gap: 2 },
    controles: { flexDirection: 'row', gap: theme.spacing.sm },
    contador: { flex: 1, gap: theme.spacing.xs },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    boton: {
      // 44 es el minimo comodo para tocar sin errarle.
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonApagado: { opacity: 0.4 },
    presionado: { opacity: 0.6 },
    numero: { minWidth: 32, textAlign: 'center' },
  });
