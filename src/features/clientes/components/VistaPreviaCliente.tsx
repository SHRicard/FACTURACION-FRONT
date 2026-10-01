import { CalendarDays, Wallet } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { formatearMoneda, formatearVentanaPago, iniciales } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

interface VistaPreviaClienteProps {
  nombre: string;
  dni: string;
  /** Solo digitos, como lo guarda el formulario. Vacio o `'0'` = sin limite. */
  limiteCredito: string;
  desdeDia: number;
  hastaDia: number;
}

/**
 * El cliente como va a quedar, armandose mientras se escribe.
 *
 * Es lo que le da cara al formulario: en vez de siete cajas vacias, arriba se
 * ve a la persona con sus condiciones —cuando paga, cuanto se le fia— que es
 * justo lo que despues se mira en la ficha.
 */
export function VistaPreviaCliente({
  nombre,
  dni,
  limiteCredito,
  desdeDia,
  hastaDia,
}: VistaPreviaClienteProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const letras = iniciales(nombre);
  const limite = Number(limiteCredito) || 0;

  return (
    <View
      style={styles.tarjeta}
      accessible
      accessibilityLabel={`Vista previa: ${nombre || 'cliente nuevo'}`}
    >
      <View style={styles.fila}>
        <View style={[styles.avatar, !letras && styles.avatarVacio]}>
          <Text variant="title" weight="bold" family="text" tone={letras ? 'onPrimary' : 'muted'}>
            {letras || '?'}
          </Text>
        </View>
        <View style={styles.textos}>
          <Text
            variant="title"
            weight="bold"
            numberOfLines={1}
            tone={nombre.trim() ? 'default' : 'muted'}
          >
            {nombre.trim() || 'Cliente nuevo'}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {dni.trim() ? `DNI ${dni.trim()}` : 'Sin DNI todavía'}
          </Text>
        </View>
      </View>

      <View style={styles.condiciones}>
        <View style={styles.chip}>
          <CalendarDays size={14} color={theme.colors.textMuted} />
          <Text variant="caption" weight="medium">
            Paga {formatearVentanaPago(desdeDia, hastaDia)}
          </Text>
        </View>
        <View style={styles.chip}>
          <Wallet size={14} color={theme.colors.textMuted} />
          <Text variant="caption" weight="medium">
            {limite > 0 ? `Fía hasta ${formatearMoneda(limite)}` : 'Sin límite de crédito'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    tarjeta: {
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    fila: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    avatar: {
      width: theme.spacing.xxl + theme.spacing.sm,
      height: theme.spacing.xxl + theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
    },
    avatarVacio: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.border,
    },
    textos: { flex: 1, gap: 2 },
    condiciones: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.background,
    },
  });
