import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import type { FaseLogo } from '../hooks/useSubirLogo';

import { BarraProgreso } from './BarraProgreso';

interface VistaPreviaLogoProps {
  uri: string;
  fase: FaseLogo;
  /** De 0 a 1. */
  progreso: number;
  error: string | null;
}

/**
 * La imagen elegida antes de guardarla, y la barra mientras sube. Va adentro
 * del modal de confirmacion: el logo viejo no se pisa hasta tocar "Guardar".
 */
export function VistaPreviaLogo({ uri, fase, progreso, error }: VistaPreviaLogoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.bloque}>
      <View style={styles.marco}>
        <Image
          source={{ uri }}
          style={styles.imagen}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          accessibilityLabel="Vista previa del logo"
        />
      </View>

      {fase !== 'quieto' ? <BarraProgreso fase={fase} progreso={progreso} /> : null}

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
    bloque: { gap: theme.spacing.md },
    marco: {
      alignSelf: 'center',
      width: '70%',
      aspectRatio: 1,
      padding: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    imagen: { width: '100%', height: '100%' },
  });
