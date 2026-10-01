import { ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/shared/ui/atoms';
import { contar } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { haceCuanto, TEXTO_PLATAFORMA } from '../formato';
import type { GrupoError } from '../types';

interface FilaErrorAppProps {
  grupo: GrupoError;
  onPress: (huella: string) => void;
}

/** `TypeError: Cannot read x of undefined`. Sin nombre, el mensaje solo. */
export const tituloDeError = (grupo: Pick<GrupoError, 'nombre' | 'mensaje'>): string =>
  grupo.nombre ? `${grupo.nombre}: ${grupo.mensaje}` : grupo.mensaje;

/**
 * Un grupo de errores: el mismo error en 100 telefonos es un renglon. El
 * mensaje va en monoespaciado y recortado; "FATAL" en rojo si alguna vez tiro
 * la app abajo.
 */
function FilaErrorAppComponent({ grupo, onPress }: FilaErrorAppProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const titulo = tituloDeError(grupo);
  const detalle = [
    contar(grupo.cantidad, 'vez', 'veces'),
    contar(grupo.usuariosAfectados, 'persona', 'personas'),
    `visto ${haceCuanto(grupo.ultimaVez) ?? '—'}`,
  ].join(' · ');
  const plataformas = grupo.plataformas.map((p) => TEXTO_PLATAFORMA[p]).join(', ');

  return (
    <Pressable
      onPress={() => onPress(grupo.huella)}
      style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
      accessibilityRole="button"
      accessibilityLabel={`${grupo.fatales > 0 ? 'Fatal. ' : ''}${titulo}. ${detalle}. ${plataformas}`}
    >
      <View style={styles.datos}>
        <Text variant="caption" weight="medium" numberOfLines={2} style={styles.mono}>
          {titulo}
        </Text>
        {grupo.ruta ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            en {grupo.ruta}
          </Text>
        ) : null}
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {detalle}
        </Text>
        <View style={styles.chips}>
          {grupo.fatales > 0 ? <Badge label="FATAL" tone="error" /> : null}
          {grupo.plataformas.map((plataforma) => (
            <Badge key={plataforma} label={TEXTO_PLATAFORMA[plataforma]} tone="neutral" />
          ))}
        </View>
      </View>
      <ChevronRight size={20} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export const FilaErrorApp = memo(FilaErrorAppComponent);

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
    mono: { fontFamily: theme.typography.mono },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, marginTop: 2 },
  });
