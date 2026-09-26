import { CircleCheck, CircleX } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface FilaServicioProps {
  nombre: string;
  /** Para que sirve: lo que deja de andar si esta apagado. */
  descripcion: string;
  configurado: boolean;
}

/**
 * El semaforo de un servicio externo. Icono Y texto: verde o rojo solos no le
 * dicen nada a quien no distingue los colores.
 */
export function FilaServicio({ nombre, descripcion, configurado }: FilaServicioProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const Icono = configurado ? CircleCheck : CircleX;

  return (
    <View
      style={styles.fila}
      accessible
      accessibilityLabel={`${nombre}: ${configurado ? 'configurado' : 'sin configurar'}. ${descripcion}`}
    >
      <Icono size={20} color={configurado ? theme.colors.success : theme.colors.error} />
      <View style={styles.textos}>
        <Text variant="body" weight="medium">
          {nombre}
        </Text>
        <Text variant="caption" tone="muted">
          {descripcion}
        </Text>
      </View>
      <Text variant="caption" weight="bold" tone={configurado ? 'success' : 'error'}>
        {configurado ? 'OK' : 'Apagado'}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    textos: { flex: 1, gap: 2 },
  });
