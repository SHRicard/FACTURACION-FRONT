import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme, type Theme } from '@/theme';

/**
 * Acceso flotante al catalogo del design system.
 *
 * Solo aparece en desarrollo (`__DEV__`): en un build de produccion el bundler
 * lo elimina junto con la rama muerta. Se esconde cuando ya estas en el catalogo.
 */
export function BotonDesignSystem() {
  // Los hooks van SIEMPRE antes de cualquier return condicional.
  const pathname = usePathname();
  const theme = useTheme();

  if (!__DEV__ || pathname === '/design-system') return null;

  const styles = createStyles(theme);

  return (
    <Link href="/design-system" asChild>
      <Pressable
        style={styles.boton}
        accessibilityRole="button"
        accessibilityLabel="Abrir el catalogo del design system"
      >
        <Text style={styles.emoji}>🎨</Text>
      </Pressable>
    </Link>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    boton: {
      position: 'absolute',
      right: theme.spacing.lg,
      bottom: theme.spacing.xxl,
      width: 56,
      height: 56,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      // Sombra para que se despegue del contenido de la pantalla.
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    emoji: { fontSize: 24 },
  });
