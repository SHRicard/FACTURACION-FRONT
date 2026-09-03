import { MailCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { AuthLayout, CampoControlado, EnlaceAuth } from '../components';
import { useRecuperarPassword } from '../hooks';

/**
 * Pantalla de recuperacion de contrasena.
 *
 * Tiene dos estados: el formulario y la confirmacion de que el mail salio.
 * No navega a ningun lado al enviar: la persona tiene que ir a su casilla.
 */
export function RecuperarPasswordScreen() {
  const { form, enviar, cargando, error, enviado, mensaje } = useRecuperarPassword();
  const theme = useTheme();
  const styles = createStyles(theme);

  if (enviado) {
    return (
      <AuthLayout
        titulo="Revisa tu correo"
        subtitulo="Si el email existe en nuestro sistema, te mandamos las instrucciones para recuperar tu contrasena."
        footer={<EnlaceAuth href="/login" label="Volver a iniciar sesion" />}
      >
        <View style={styles.confirmacion} accessibilityLiveRegion="polite">
          <MailCheck size={40} color={theme.colors.success} />
          <Text variant="body" tone="muted" center>
            {mensaje ?? 'Revisa tambien la carpeta de spam.'}
          </Text>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      titulo="Recuperar contrasena"
      subtitulo="Ingresa tu email y te mandamos un enlace para crear una nueva."
      error={error}
      footer={<EnlaceAuth href="/login" label="Volver a iniciar sesion" />}
    >
      <CampoControlado
        control={form.control}
        name="email"
        label="Email"
        required
        placeholder="tu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="done"
        onSubmitEditing={enviar}
      />

      <Button label="Enviar enlace" onPress={enviar} loading={cargando} fullWidth size="lg" />
    </AuthLayout>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    confirmacion: {
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
    },
  });
