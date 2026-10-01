import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { AuthLayout } from '../components';
import { useCuentaSuspendida } from '../hooks';

/**
 * El cartel que ve alguien cuya cuenta suspendió el super_admin.
 *
 * Muestra el mensaje del backend y, si vino, el motivo. La única salida es
 * volver al login: no hay nada que reintentar hasta que la reactiven.
 *
 * No se bifurca por ancho: es un cartel centrado, igual que el login.
 */
export function CuentaSuspendidaScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { suspension, volverAlLogin } = useCuentaSuspendida();

  // Se entró sin pasar por una suspensión (una recarga en web): a la raíz, que
  // decide a dónde va.
  if (!suspension) return <Redirect href="/" />;

  return (
    <AuthLayout logo titulo="Cuenta suspendida" subtitulo={suspension.mensaje}>
      {suspension.motivo ? (
        <View style={styles.motivo} accessible accessibilityLabel={`Motivo: ${suspension.motivo}`}>
          <Text variant="caption" tone="muted">
            Motivo
          </Text>
          <Text variant="body">{suspension.motivo}</Text>
        </View>
      ) : null}

      <Button label="Volver al inicio de sesión" onPress={volverAlLogin} fullWidth />
    </AuthLayout>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    motivo: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  });
