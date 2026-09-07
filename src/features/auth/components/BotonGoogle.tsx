import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { LogoGoogle } from './LogoGoogle';

type BotonGoogleProps = {
  onPress: () => void;
  cargando?: boolean;
  /** Se deshabilita mientras corre el formulario de al lado. */
  deshabilitado?: boolean;
  /** Error del intento con Google (no del formulario). */
  error?: string | null;
};

/**
 * "Continuar con Google" con el separador que lo despega del formulario.
 *
 * Lo comparten login y registro: en los dos, entrar con Google hace lo mismo
 * (si la cuenta no existe la crea, y si existe entra), asi que ofrecerlo en una
 * sola de las dos pantallas seria un callejon sin salida para quien llego a la
 * otra.
 */
export function BotonGoogle({ onPress, cargando, deshabilitado, error }: BotonGoogleProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.contenedor}>
      <View style={styles.separador}>
        <View style={styles.linea} />
        <Text variant="caption" tone="muted">
          o
        </Text>
        <View style={styles.linea} />
      </View>

      {error ? (
        <View accessibilityLiveRegion="polite" accessibilityRole="alert">
          <Text variant="caption" tone="error" center>
            {error}
          </Text>
        </View>
      ) : null}

      <Button
        label="Continuar con Google"
        onPress={onPress}
        variant="secondary"
        size="lg"
        fullWidth
        loading={cargando}
        disabled={deshabilitado}
        leftIcon={<LogoGoogle size={20} />}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    contenedor: { gap: theme.spacing.md },
    separador: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    linea: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
  });
