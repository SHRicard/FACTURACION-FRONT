import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Container, Text } from '@/shared/ui/atoms';
import { useTheme, useThemeMode, type Theme } from '@/theme';

import { Pestanas, VistaComponentes, VistaConfiguracion, type Pestana } from '../components';

type ClaveVista = 'configuracion' | 'componentes';

const VISTAS: readonly Pestana<ClaveVista>[] = [
  { clave: 'configuracion', etiqueta: 'Configuracion' },
  { clave: 'componentes', etiqueta: 'Componentes' },
];

/**
 * Catalogo vivo del design system, en dos vistas.
 *
 * `Configuracion` junta todo lo que CAMBIA la app —modo, tipografia, barra de
 * tabs, cabecera— para verlo de un vistazo y probar combinaciones.
 * `Componentes` es el catalogo: los tokens y los atoms sueltos.
 *
 * Estaban mezclados en una sola tira y no se distinguia lo que se elige de lo
 * que solo se mira. Todo sale de los tokens del theme, asi que cambiar de modo
 * reestiliza la pantalla entera sola.
 */
export function DesignSystemScreen() {
  const theme = useTheme();
  const { colorScheme } = useThemeMode();
  const router = useRouter();
  const styles = createStyles(theme);

  const [vista, setVista] = useState<ClaveVista>('configuracion');

  /**
   * Salida propia de la pantalla.
   *
   * No alcanza con el boton fisico de atras: si se entra por deep link
   * (`facturacionfront://design-system`) no hay historial que desandar y el back
   * te saca de la app. Como ademas el boton flotante se esconde estando aca,
   * quedarias sin ninguna salida.
   */
  const volver = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Container ancho="ancho" style={styles.contenido}>
          <View style={styles.titulo}>
            <Pressable
              onPress={volver}
              style={styles.volver}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <ChevronLeft size={28} color={theme.colors.primary} strokeWidth={2.2} />
            </Pressable>
            <Text variant="heading" weight="bold" accessibilityRole="header">
              Design System
            </Text>
            <Text variant="caption" tone="muted">
              Todos los tokens y atoms de la app. Modo actual: {colorScheme}.
            </Text>
          </View>

          <Pestanas opciones={VISTAS} activa={vista} onCambiar={setVista} />

          {vista === 'configuracion' ? <VistaConfiguracion /> : <VistaComponentes />}
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { paddingVertical: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
    contenido: { gap: theme.spacing.lg },
    titulo: { gap: theme.spacing.xs, alignItems: 'flex-start' },
    volver: {
      // Touch target accesible: el glifo es de 28 pero la zona tocable, 44.
      width: 44,
      height: 44,
      marginLeft: -theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.full,
    },
  });
