import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Container, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { useSesion } from '../hooks/useSesion';

/** Pantalla inicial. Sin sesion activa, manda a login. */
export function HomeScreen() {
  const { usuario, estaAutenticado, cerrarSesion } = useSesion();
  const theme = useTheme();
  const styles = createStyles(theme);

  if (!estaAutenticado) return <Redirect href="/login" />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centro}>
        <Container ancho="formulario" style={styles.contenido}>
          <Text variant="heading" weight="bold" accessibilityRole="header">
            Hola{usuario ? `, ${usuario.nombre}` : ''}
          </Text>
          <Text variant="body" tone="muted">
            Sesion iniciada{usuario ? ` como ${usuario.email}` : ''}.
          </Text>
          <Button label="Cerrar sesion" variant="secondary" onPress={cerrarSesion} fullWidth />
        </Container>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    centro: { flex: 1, justifyContent: 'center' },
    contenido: { gap: theme.spacing.md },
  });
