import { AlertCircle } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Image, KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Container, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

/**
 * Lado del logo, en puntos. No sale del theme porque no lo comparte nadie: lo
 * dibuja solo este marco, y el asset ya viene en 1x/2x/3x para esta medida.
 */
const LADO_LOGO = 128;

type AuthLayoutProps = {
  /** Dibuja el logo de la app arriba del titulo. */
  logo?: boolean;
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
export function AuthLayout({
  logo = false,
  titulo,
  subtitulo,
  error,
  children,
  footer,
}: AuthLayoutProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/*
        `padding` en las DOS plataformas, no solo en iOS.

        Android traia `undefined`, que desactiva el componente: se confiaba en el
        `adjustResize` del manifest, que redimensiona la ventana cuando aparece el
        teclado. Pero la app dibuja edge-to-edge, y ahi la ventana ya ocupa toda
        la pantalla y no se achica: el teclado se dibuja ENCIMA del formulario y
        el ultimo campo queda tapado sin forma de llegar a el.

        Con `padding`, el alto disponible se reduce de verdad, el ScrollView
        vuelve a tener contenido que no entra y puede desplazarse hasta el campo
        enfocado.
      */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Un formulario de login no gana nada midiendo 1900px. */}
          <Container ancho="formulario" style={styles.contenido}>
            {/*
              El asset se importa por nombre base: Metro elige la densidad
              (@2x/@3x) segun la pantalla. La ruta tiene que ser estatica.
            */}
            {logo ? (
              <Image
                source={require('../assets/logo-app.png')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityRole="image"
                accessibilityLabel="Facturación FCT"
              />
            ) : null}

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
    logo: { width: LADO_LOGO, height: LADO_LOGO, alignSelf: 'center' },
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
