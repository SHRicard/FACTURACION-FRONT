import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import type { FaseLogo } from '../hooks/useSubirLogo';

interface BarraProgresoProps {
  fase: Exclude<FaseLogo, 'quieto'>;
  /** De 0 a 1. */
  progreso: number;
}

/** La subida del logo: cuanto lleva a Cloudinary, y despues el guardado en la marca. */
export function BarraProgreso({ fase, progreso }: BarraProgresoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const porcentaje = fase === 'guardando' ? 100 : Math.round(progreso * 100);

  return (
    <View
      style={styles.bloque}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: porcentaje }}
    >
      <View style={styles.pista}>
        <View style={[styles.relleno, { width: `${porcentaje}%` }]} />
      </View>
      <Text variant="caption" tone="muted" accessibilityLiveRegion="polite">
        {fase === 'subiendo' ? `Subiendo el logo… ${porcentaje} %` : 'Guardando en tu marca…'}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bloque: { gap: theme.spacing.xs },
    pista: {
      height: theme.spacing.xs,
      overflow: 'hidden',
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.border,
    },
    relleno: { height: '100%', backgroundColor: theme.colors.primary },
  });
