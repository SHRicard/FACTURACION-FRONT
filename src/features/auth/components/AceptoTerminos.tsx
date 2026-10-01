import { Link } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { RUTA_POR_DOCUMENTO } from '@/features/legal/rutas';
import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface AceptoTerminosProps {
  valor: boolean;
  onCambiar: (valor: boolean) => void;
  /** Mensaje de por que no se puede seguir sin tildarla. */
  error?: string | null;
  deshabilitado?: boolean;
}

/**
 * La casilla del consentimiento, con los dos links al lado.
 *
 * Tres cosas que Google mira en la revision de Play y que no se pueden cambiar
 * sin romper el alta:
 *   - arranca SIN tildar (el `valor` lo maneja quien la usa, y arranca en false);
 *   - los dos documentos estan a la vista, no escondidos en un menu;
 *   - no alcanza con un "al registrarte aceptas": tiene que haber casilla.
 *
 * Es del dominio de auth (la usan el registro y el dialogo de Google), asi que
 * no va a `shared/ui/atoms`: el dia que una segunda feature necesite una casilla
 * generica, ahi se promueve un `Checkbox` y esto se apoya en el.
 */
export function AceptoTerminos({ valor, onCambiar, error, deshabilitado }: AceptoTerminosProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.bloque}>
      <Pressable
        onPress={() => onCambiar(!valor)}
        disabled={deshabilitado}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: valor, disabled: deshabilitado }}
        accessibilityLabel="Acepto los términos y condiciones y la política de privacidad"
        hitSlop={8}
        style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
      >
        <View
          style={[
            styles.casilla,
            valor && styles.tildada,
            error ? styles.conError : null,
            deshabilitado && styles.apagada,
          ]}
        >
          {valor ? <Check size={16} color={theme.colors.onPrimary} strokeWidth={3} /> : null}
        </View>

        {/*
          Los links van DENTRO del parrafo: asi se leen como parte de la frase y
          no como dos botones sueltos. Tocar el link abre el documento; tocar
          cualquier otra parte de la fila tilda la casilla.
        */}
        <Text variant="caption" style={styles.texto}>
          Acepto los{' '}
          <Link href={RUTA_POR_DOCUMENTO.terminos} style={styles.enlace}>
            términos y condiciones
          </Link>{' '}
          y la{' '}
          <Link href={RUTA_POR_DOCUMENTO.privacidad} style={styles.enlace}>
            política de privacidad
          </Link>
          .
        </Text>
      </Pressable>

      {error ? (
        <Text variant="caption" tone="error" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bloque: { gap: theme.spacing.xs },
    fila: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      // Minimo accesible para tocar comodo.
      minHeight: 44,
      paddingVertical: theme.spacing.xs,
    },
    presionada: { opacity: 0.7 },
    casilla: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.sm,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    tildada: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    conError: { borderColor: theme.colors.error },
    apagada: { opacity: 0.5 },
    texto: { flex: 1 },
    enlace: {
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
  });
