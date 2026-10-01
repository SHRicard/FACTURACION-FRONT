import { ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BarraProporcion } from '@/features/metricas/components';
import { PRESENTACION_TIPO } from '@/features/notificaciones/tipos';
import { Badge, Text, type BadgeTone } from '@/shared/ui/atoms';
import { haceCuanto } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { AvisoAdmin, EstadoAviso } from '../types';

/** El chip de cada estado del envio (docs/NOTIFICACIONES.md, 7.5). */
export const CHIP_ESTADO_AVISO: Record<EstadoAviso, { etiqueta: string; tono: BadgeTone }> = {
  enviando: { etiqueta: 'Enviando…', tono: 'primary' },
  enviado: { etiqueta: 'Enviado', tono: 'success' },
  fallido: { etiqueta: 'Falló', tono: 'error' },
  desconocido: { etiqueta: 'Sin estado', tono: 'neutral' },
};

/** Cuanto del envio ya se proceso, de 0 a 1. */
export const avanceDelEnvio = ({ envio }: Pick<AvisoAdmin, 'envio'>): number =>
  envio.dispositivos > 0 ? (envio.enviados + envio.rechazados) / envio.dispositivos : 1;

interface FilaAvisoAdminProps {
  aviso: AvisoAdmin;
  onPress: (id: string) => void;
}

/** Un aviso del historial: tipo, titulo, cuando, estado y a cuantos llego. */
function FilaAvisoAdminComponent({ aviso, onPress }: FilaAvisoAdminProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { Icono, etiqueta } = PRESENTACION_TIPO[aviso.tipo];
  const chip = CHIP_ESTADO_AVISO[aviso.estado];
  const llegada = `entregado a ${aviso.envio.entregados} de ${aviso.envio.dispositivos}`;

  return (
    <Pressable
      onPress={() => onPress(aviso.id)}
      style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
      accessibilityRole="button"
      accessibilityLabel={`${etiqueta}: ${aviso.titulo}. ${chip.etiqueta}, ${llegada}`}
    >
      <Icono size={20} color={theme.colors.textMuted} />
      <View style={styles.datos}>
        <Text variant="body" weight="medium" numberOfLines={1}>
          {aviso.titulo}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {haceCuanto(aviso.createdAt)} · {llegada}
        </Text>
        <View style={styles.chips}>
          <Badge label={chip.etiqueta} tone={chip.tono} />
        </View>
        {aviso.estado === 'enviando' ? (
          <BarraProporcion
            etiqueta="Avance"
            valor={`${Math.round(avanceDelEnvio(aviso) * 100)} %`}
            proporcion={avanceDelEnvio(aviso)}
            tono="primary"
          />
        ) : null}
      </View>
      <ChevronRight size={20} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export const FilaAvisoAdmin = memo(FilaAvisoAdminComponent);

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
  });
