import { WifiOff } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, Container, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { useArranqueSesion } from '../hooks';
import { AvisoSesion } from './AvisoSesion';

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
 * quien nunca inicio sesion pasa de largo sin bloquearse. Además tiene tope: el
 * pedido se corta a los 20 s. Si falla por algo que no es la sesión (sin red,
 * el backend caído), se ofrece reintentar sin perder el token, o salir.
 *
 * También monta el aviso de una sola vez de la sesión recién abierta.
 */
export function ArranqueSesion({ children }: { children: ReactNode }) {
  const { verificada, fallo, reintentar, salir } = useArranqueSesion();
  const theme = useTheme();
  const styles = createStyles(theme);

  if (!verificada && fallo) {
    return (
      <View style={[styles.pantalla, styles.conMargen]}>
        <Container style={styles.fallo}>
          {/* El icono es decorativo: lo que se lee es el titulo. */}
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <WifiOff size={40} color={theme.colors.textMuted} />
          </View>
          <Text variant="title" weight="bold" center accessibilityRole="header">
            No pudimos verificar tu sesión
          </Text>
          <View accessibilityLiveRegion="polite">
            <Text variant="body" tone="muted" center>
              {fallo}
            </Text>
          </View>
          <Button label="Reintentar" onPress={reintentar} fullWidth size="lg" />
          <Button label="Salir de la cuenta" variant="ghost" onPress={salir} fullWidth />
        </Container>
      </View>
    );
  }

  if (!verificada) {
    return (
      <View style={styles.pantalla}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      {children}
      <AvisoSesion />
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    pantalla: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    // Solo arriba y abajo: los costados ya los pone el `Container`.
    conMargen: {
      paddingVertical: theme.spacing.lg,
    },
    fallo: {
      gap: theme.spacing.md,
      alignItems: 'center',
    },
  });
