import { AlertCircle } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Container, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

type AuthLayoutProps = {
  titulo: string;
  subtitulo: string;
  /** Error general de la operacion (no de un campo). */
  error?: string | null;
  children: ReactNode;
  /** Links de abajo de todo (ej. "No tenes cuenta? Registrate"). */
  footer?: ReactNode;
};

/**
 * Marco visual compartido por login, registro y recuperar contrasena.
 *
 * Resuelve lo aburrido pero importante: que el teclado no tape los campos, que
 * el contenido siga scrolleando en pantallas chicas y que el formulario no se
 * estire a lo ancho de un monitor (de eso se ocupa el `Container`).
 */
export function AuthLayout({ titulo, subtitulo, error, children, footer }: AuthLayoutProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Un formulario de login no gana nada midiendo 1900px. */}
          <Container ancho="formulario" style={styles.contenido}>
            <View style={styles.encabezado}>
              <Text variant="heading" weight="bold" accessibilityRole="header">
                {titulo}
              </Text>
              <Text variant="body" tone="muted">
                {subtitulo}
              </Text>
            </View>

            {/* Error general: con icono ademas de color, y anunciado por el lector. */}
            {error ? (
              <View style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
                <AlertCircle size={18} color={theme.colors.error} />
                <View style={styles.flex}>
                  <Text variant="caption" tone="error">
                    {error}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.campos}>{children}</View>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    flex: { flex: 1 },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: theme.spacing.lg,
    },
    contenido: { gap: theme.spacing.lg },
    encabezado: { gap: theme.spacing.xs },
    error: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.surface,
    },
    campos: { gap: theme.spacing.md },
    footer: { alignItems: 'center', gap: theme.spacing.sm },
  });
