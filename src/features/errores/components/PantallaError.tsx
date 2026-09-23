import { router, usePathname, type ErrorBoundaryProps } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { reportarError } from '@/services/errores';
import { Button, Container, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

/**
 * Lo que se ve cuando algo revienta al renderizar (K12). Reemplaza al cartel
 * por defecto de expo-router, que está en inglés y muestra el mensaje técnico.
 *
 * Reporta el error al back una sola vez por error: el efecto vuelve a correr
 * si cambia la ruta, pero el mismo error no se manda dos veces.
 */
export function PantallaError({ error, retry }: ErrorBoundaryProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // Lee el store global de expo-router: funciona aunque el Stack esté caído.
  const ruta = usePathname();
  const reportado = useRef<Error | null>(null);

  useEffect(() => {
    if (reportado.current === error) return;
    reportado.current = error;
    void reportarError(error, { fatal: false, ruta });
  }, [error, ruta]);

  /*
   * El boundary de la raíz desmonta el Stack, y React Navigation limpia su
   * estado al desmontarse (el cleanup de useNavigationBuilder). Por eso
   * `retry` ya remonta desde el inicio; el replace lo asegura.
   */
  const volverAlInicio = useCallback(() => {
    void retry().then(() => {
      try {
        router.replace('/');
      } catch {
        /* sin navegador montado todavía */
      }
    });
  }, [retry]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Container ancho="formulario" style={styles.contenido}>
        {/* El icono es decorativo: lo que se lee es el titulo. */}
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <TriangleAlert size={40} color={theme.colors.error} />
        </View>
        <Text variant="title" weight="bold" center accessibilityRole="header">
          Algo salió mal
        </Text>
        <Text variant="body" tone="muted" center>
          Tuvimos un problema al mostrar esta pantalla. Probá de nuevo; si vuelve a pasar, volvé al
          inicio.
        </Text>
        {__DEV__ ? (
          <Text variant="caption" tone="muted" center selectable>
            {error.message}
          </Text>
        ) : null}
        <Button label="Reintentar" onPress={() => void retry()} fullWidth size="lg" />
        <Button label="Volver al inicio" variant="ghost" onPress={volverAlInicio} fullWidth />
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
