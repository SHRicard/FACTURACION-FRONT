import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AjusteNotificaciones } from '@/features/notificaciones/components';
import {
  Pantalla,
  SelectorEstiloCabecera,
  SelectorEstiloTabs,
  SelectorModo,
  SelectorTipografia,
  Text,
} from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

/**
 * Ajustes de la app. Todo lo de aca se guarda en el storage local: son
 * preferencias del dispositivo, no datos de la cuenta.
 */
export function ConfiguracionMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Pantalla titulo="Configuracion" onVolver={() => router.back()} labelVolver="Mas">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.bloque}>
          <View style={styles.encabezado}>
            <Text variant="title" weight="bold" accessibilityRole="header">
              Apariencia
            </Text>
            <Text variant="caption" tone="muted">
              Como se ve la app en este dispositivo.
            </Text>
          </View>
          <SelectorModo />
        </View>

        {/* En web o en un emulador no se dibuja: ahi no llegan. */}
        <AjusteNotificaciones />

        <View style={styles.bloque}>
          <View style={styles.encabezado}>
            <Text variant="title" weight="bold" accessibilityRole="header">
              Tipografia
            </Text>
            <Text variant="caption" tone="muted">
              Cada opcion se muestra con su propia fuente.
            </Text>
          </View>
          <SelectorTipografia />
        </View>

        <View style={styles.bloque}>
          <View style={styles.encabezado}>
            <Text variant="title" weight="bold" accessibilityRole="header">
              Barra de tabs
            </Text>
            <Text variant="caption" tone="muted">
              La barra de abajo cambia al instante.
            </Text>
          </View>
          <SelectorEstiloTabs />
        </View>

        <View style={styles.bloque}>
          <View style={styles.encabezado}>
            <Text variant="title" weight="bold" accessibilityRole="header">
              Cabecera
            </Text>
            <Text variant="caption" tone="muted">
              Como se ve el titulo al entrar al detalle de algo.
            </Text>
          </View>
          <SelectorEstiloCabecera />
        </View>
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.xl, paddingBottom: theme.spacing.xl },
    bloque: { gap: theme.spacing.md },
    encabezado: { gap: theme.spacing.xs },
  });
