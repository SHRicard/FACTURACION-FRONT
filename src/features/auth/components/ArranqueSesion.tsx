import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme, type Theme } from '@/theme';

import { useArranqueSesion } from '../hooks';

/**
 * Retiene el arbol de navegacion hasta saber si la sesion guardada sigue viva.
 *
 * Envuelve al `<Stack>` en el layout raiz. Sin esto, las rutas se montan con el
 * store todavia vacio: la home no ve usuario, redirige a /login, y un segundo
 * despues el `/auth/me` responde que la sesion estaba bien y hay que volver.
 * Ese ida y vuelta se ve como un parpadeo y, peor, pisa el deep link con el que
 * la persona entro.
 *
 * La espera es corta (una request) y solo ocurre cuando hay un token guardado:
 * quien nunca inicio sesion pasa de largo sin bloquearse.
 */
export function ArranqueSesion({ children }: { children: ReactNode }) {
  const { verificada } = useArranqueSesion();
  const theme = useTheme();
  const styles = createStyles(theme);

  if (!verificada) {
    return (
      <View style={styles.pantalla}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    pantalla: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
  });
