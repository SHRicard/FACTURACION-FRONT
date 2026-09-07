import { useLocalSearchParams } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, CampoControlado, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { AuthLayout, EnlaceAuth } from '../components';
import { useResetearPassword } from '../hooks';

/**
 * Pantalla a la que lleva el link del mail: `/resetear-password?token=xxx`.
 *
 * Tiene tres estados, y los tres importan: mientras valida el token, cuando el
 * link no sirve, y el formulario en si. Sin el primero se ve un parpadeo del
 * formulario que despues desaparece; sin el segundo, la persona escribe una
 * contrasena nueva para recien ahi enterarse de que el link vencio.
 */
export function ResetearPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const theme = useTheme();
  const styles = createStyles(theme);

  const { form, enviar, cargando, error, validando, tokenValido, emailDeLaCuenta, errorDelToken } =
    useResetearPassword(token ?? null);

  if (validando) {
    return (
      <AuthLayout titulo="Un momento" subtitulo="Estamos validando tu enlace.">
        <View style={styles.centrado} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </AuthLayout>
    );
  }

  if (!tokenValido) {
    return (
      <AuthLayout
        titulo="Enlace no valido"
        subtitulo="Los enlaces de recuperacion duran 60 minutos y se pueden usar una sola vez."
        footer={
          <>
            <EnlaceAuth href="/recuperar-password" label="Pedir un enlace nuevo" />
            <EnlaceAuth href="/login" label="Volver a iniciar sesion" />
          </>
        }
      >
        <View style={styles.centrado} accessibilityLiveRegion="polite" accessibilityRole="alert">
          <ShieldAlert size={40} color={theme.colors.error} />
          <Text variant="body" tone="muted" center>
            {errorDelToken ?? 'El link no es valido o ya vencio.'}
          </Text>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      titulo="Nueva contrasena"
      subtitulo={
        emailDeLaCuenta
          ? `Estas cambiando la contrasena de ${emailDeLaCuenta}.`
          : 'Elegi una contrasena nueva para tu cuenta.'
      }
      error={error}
      footer={<EnlaceAuth href="/login" label="Volver a iniciar sesion" />}
    >
      <CampoControlado
        control={form.control}
        name="password"
        label="Contrasena nueva"
        required
        placeholder="Minimo 6 caracteres"
        helperText="Al menos 6 caracteres."
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
      />

      <CampoControlado
        control={form.control}
        name="confirmarPassword"
        label="Repetir contrasena"
        required
        placeholder="Escribila de nuevo"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={enviar}
      />

      <Button label="Guardar contrasena" onPress={enviar} loading={cargando} fullWidth size="lg" />
    </AuthLayout>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    centrado: {
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
    },
  });
