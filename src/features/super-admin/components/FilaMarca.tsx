import { ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AvatarIniciales } from '@/features/marcas/components';
import { Badge, Text } from '@/shared/ui/atoms';
import { contar, formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { DIAS_ACTIVIDAD, diasDesde, haceCuanto } from '../formato';
import type { MarcaEnListado } from '../types';

interface FilaMarcaProps {
  marca: MarcaEnListado;
  onPress: (id: string) => void;
}

/**
 * Una marca del listado: cuanto mueve y cuando se uso por ultima vez. La
 * actividad va en gris si pasaron mas de 30 dias: esa marca esta dormida.
 */
function FilaMarcaComponent({ marca, onPress }: FilaMarcaProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const dias = diasDesde(marca.ultimaActividad);
  const dormida = dias === null || dias > DIAS_ACTIVIDAD;
  const actividad = marca.ultimaActividad
    ? `usada ${haceCuanto(marca.ultimaActividad)}`
    : 'nunca se usó';
  const { estadisticas } = marca;

  return (
    <Pressable
      onPress={() => onPress(marca.id)}
      style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
      accessibilityRole="button"
      accessibilityLabel={`${marca.nombre}, ${contar(estadisticas.cantidadClientes, 'cliente', 'clientes')}, vendió ${formatearMoneda(estadisticas.totalVendido)}, deuda ${formatearMoneda(estadisticas.deudaPendiente)}, ${actividad}`}
    >
      <AvatarIniciales nombre={marca.nombre} imagen={marca.logoUrl ?? undefined} />
      <View style={styles.datos}>
        <Text variant="body" weight="medium" numberOfLines={1}>
          {marca.nombre}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {contar(marca.duenos.length, 'dueño', 'dueños')} ·{' '}
          {contar(estadisticas.cantidadClientes, 'cliente', 'clientes')}
        </Text>
        <Text variant="caption" tone={dormida ? 'muted' : 'default'} numberOfLines={1}>
          {actividad}
        </Text>
        {dormida ? (
          <View style={styles.chips}>
            <Badge label="Dormida" tone="neutral" />
          </View>
        ) : null}
      </View>
      <View style={styles.montos}>
        <Text variant="body" weight="bold" family="text">
          {formatearMoneda(estadisticas.totalVendido)}
        </Text>
        <Text variant="caption" tone={estadisticas.deudaPendiente > 0 ? 'warning' : 'muted'}>
          debe {formatearMoneda(estadisticas.deudaPendiente)}
        </Text>
      </View>
      <ChevronRight size={20} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export const FilaMarca = memo(FilaMarcaComponent);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      minHeight: 44,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    presionada: { opacity: 0.7 },
    datos: { flex: 1, gap: 2 },
    chips: { flexDirection: 'row', gap: theme.spacing.xs, marginTop: 2 },
    montos: { alignItems: 'flex-end' },
  });
