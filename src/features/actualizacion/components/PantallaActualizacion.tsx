import { Download } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Container, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

type PantallaActualizacionProps = {
  titulo: string;
  descripcion: string;
  onActualizar: () => void;
  /** Si viene, suma "Salir de la cuenta" (solo tiene sentido con sesión). */
  onSalir?: () => void;
};

/**
 * Pantalla completa de "actualizá la app". Es presentacional: la usan la
 * puerta bloqueante del 426 y la ruta /actualizar-app (rol o paso que esta
 * versión no conoce), cada una con su texto.
 */
export function PantallaActualizacion({
  titulo,
  descripcion,
  onActualizar,
  onSalir,
}: PantallaActualizacionProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Container style={styles.contenido}>
        {/* El icono es decorativo: lo que se lee es el titulo. */}
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Download size={40} color={theme.colors.primary} />
        </View>
        <Text variant="heading" weight="bold" center accessibilityRole="header">
          {titulo}
        </Text>
        <Text variant="body" tone="muted" center>
          {descripcion}
        </Text>
        <Button label="Actualizar" onPress={onActualizar} fullWidth size="lg" />
        {onSalir ? (
          <Button label="Salir de la cuenta" variant="ghost" onPress={onSalir} fullWidth />
        ) : null}
      </Container>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    contenido: {
      alignItems: 'center',
      gap: theme.spacing.md,
    },
  });
