import { Receipt, TrendingUp, Users } from 'lucide-react-native';
import { ScrollView, StyleSheet, View, type DimensionValue } from 'react-native';

import { useBreakpoint, useRefrescar } from '@/shared/hooks';
import { Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { TarjetaResumen } from '../components';
import { useDashboard } from '../hooks';

/**
 * Resumen del negocio: la primera pantalla del administrador.
 *
 * ⚠️ Las metricas todavia no tienen endpoint, por eso van en guion en vez de
 * numeros inventados: un cero falso se lee como "no facturaste nada".
 * El gesto de tirar para abajo ya esta puesto: cuando llegue la query del
 * resumen, `useDashboard` la agrega y esta pantalla no cambia.
 */
export function DashboardScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { elegir } = useBreakpoint();
  const resumen = useDashboard();
  const refresco = useRefrescar(resumen.refrescar);

  // Una tarjeta por fila en telefono; tres cuando hay lugar.
  const anchoTarjeta = elegir<DimensionValue>({ sm: '100%', md: '48%', lg: '32%' });
  const tamanoIcono = theme.typography.size.body;

  return (
    <Pantalla titulo="Dashboard" descripcion="Como viene el mes.">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <View style={styles.grilla}>
          <View style={{ width: anchoTarjeta }}>
            <TarjetaResumen
              etiqueta="Facturado este mes"
              valor="—"
              icono={<TrendingUp size={tamanoIcono} color={theme.colors.textMuted} />}
            />
          </View>
          <View style={{ width: anchoTarjeta }}>
            <TarjetaResumen
              etiqueta="Facturas emitidas"
              valor="—"
              icono={<Receipt size={tamanoIcono} color={theme.colors.textMuted} />}
            />
          </View>
          <View style={{ width: anchoTarjeta }}>
            <TarjetaResumen
              etiqueta="Clientes activos"
              valor="—"
              icono={<Users size={tamanoIcono} color={theme.colors.textMuted} />}
            />
          </View>
        </View>

        <Text variant="caption" tone="muted">
          Los datos aparecen cuando esten los endpoints del resumen.
        </Text>
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.lg, paddingBottom: theme.spacing.lg },
    grilla: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
  });
