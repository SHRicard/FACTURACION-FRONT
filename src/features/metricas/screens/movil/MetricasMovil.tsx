import { useRouter, type Href } from 'expo-router';
import {
  CalendarCheck,
  ChartColumn,
  CircleAlert,
  Percent,
  Repeat,
  Tags,
  Trophy,
  UserRoundX,
  type LucideIcon,
} from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { TarjetaMetrica } from '../../components';

interface EntradaMetrica {
  ruta: Href;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
}

/**
 * Las metricas, agrupadas por la pregunta que responden. El orden dentro de
 * cada grupo es el de uso: lo primero es a quien ir a cobrar hoy.
 */
const GRUPOS: readonly { titulo: string; metricas: readonly EntradaMetrica[] }[] = [
  {
    titulo: 'La deuda de hoy',
    metricas: [
      {
        ruta: '/admin/cuenta/metricas/morosos',
        titulo: 'Morosos',
        descripcion: 'A quién ir a cobrar, y si la morosidad crece o baja.',
        icono: CircleAlert,
      },
      {
        ruta: '/admin/cuenta/metricas/deudores',
        titulo: 'Deudores',
        descripcion: 'Todos los que deben algo, vencido o no.',
        icono: ChartColumn,
      },
      {
        ruta: '/admin/cuenta/metricas/clientes-inactivos',
        titulo: 'Dejaron de comprar y deben',
        descripcion: 'Los que no vienen más con la cuenta abierta.',
        icono: UserRoundX,
      },
    ],
  },
  {
    titulo: 'Cómo se cobra',
    metricas: [
      {
        ruta: '/admin/cuenta/metricas/tasa-cobranza',
        titulo: 'Tasa de cobranza',
        descripcion: 'De lo que se fió, cuánto volvió: si la libreta crece o se achica.',
        icono: Percent,
      },
      {
        ruta: '/admin/cuenta/metricas/pagos-a-tiempo',
        titulo: 'Pagos a tiempo',
        descripcion: 'Qué tan puntual es la clientela.',
        icono: CalendarCheck,
      },
    ],
  },
  {
    titulo: 'Clientes y ventas',
    metricas: [
      {
        ruta: '/admin/cuenta/metricas/mejores-clientes',
        titulo: 'Mejores clientes',
        descripcion: 'A quién cuidar, y a quién se le puede subir el límite.',
        icono: Trophy,
      },
      {
        ruta: '/admin/cuenta/metricas/frecuencia-compra',
        titulo: 'Frecuencia de compra',
        descripcion: 'Cada cuánto vuelve cada cliente, y quién está tardando.',
        icono: Repeat,
      },
      {
        ruta: '/admin/cuenta/metricas/ventas-por-especie',
        titulo: 'Ventas por especie',
        descripcion: 'Qué se vende más, en unidades y en plata.',
        icono: Tags,
      },
    ],
  },
];

/**
 * El menu de metricas. No trae datos: cada metrica se calcula cuando se abre
 * su pantalla, asi que aca no hay nada que refrescar.
 */
export function MetricasMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Pantalla
      titulo="Métricas"
      descripcion="Los números del negocio."
      onVolver={() => router.back()}
      labelVolver="Mas"
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {GRUPOS.map((grupo) => (
          <View key={grupo.titulo} style={styles.grupo}>
            <Text variant="caption" weight="bold" tone="muted" accessibilityRole="header">
              {grupo.titulo.toUpperCase()}
            </Text>
            {grupo.metricas.map((metrica) => (
              <TarjetaMetrica
                key={metrica.titulo}
                icono={metrica.icono}
                titulo={metrica.titulo}
                descripcion={metrica.descripcion}
                onPress={() => router.push(metrica.ruta)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.lg, paddingBottom: theme.spacing.lg },
    grupo: { gap: theme.spacing.sm },
  });
