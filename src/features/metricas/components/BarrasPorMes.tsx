import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { mesCorto, mesLargo } from '../formato';
import { colorDeTono, type TonoMetrica } from './tonos';

interface Serie {
  etiqueta: string;
  tono: TonoMetrica;
}

interface MesDeBarras {
  /** `aaaa-mm`. */
  mes: string;
  valores: readonly [number, number];
}

interface BarrasPorMesProps {
  /** Las dos cosas que se comparan, en el orden de `valores`. */
  series: readonly [Serie, Serie];
  meses: readonly MesDeBarras[];
  /** Como se dice cada valor al lector de pantalla ("$ 11.000"). */
  formatear: (valor: number) => string;
}

/**
 * Dos barras por mes, lado a lado: fiado contra cobrado.
 *
 * Todas contra el mismo maximo, asi un mes flojo se ve flojo al lado de uno
 * bueno. Los meses vacios tambien van: un hueco dice algo.
 */
export function BarrasPorMes({ series, meses, formatear }: BarrasPorMesProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  // El 1 evita dividir por cero cuando todo el periodo esta vacio.
  const maximo = Math.max(1, ...meses.flatMap((m) => m.valores));

  return (
    <View style={styles.bloque}>
      <View style={styles.leyenda}>
        {series.map((serie) => (
          <View key={serie.etiqueta} style={styles.itemLeyenda}>
            <View style={[styles.punto, { backgroundColor: colorDeTono(theme, serie.tono) }]} />
            <Text variant="caption" tone="muted">
              {serie.etiqueta}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.grafico}>
        {meses.map(({ mes, valores }) => (
          <View
            key={mes}
            style={styles.columna}
            accessible
            accessibilityLabel={`${mesLargo(mes)}: ${series[0].etiqueta} ${formatear(valores[0])}, ${series[1].etiqueta} ${formatear(valores[1])}`}
          >
            <View style={styles.barras}>
              {valores.map((valor, indice) => (
                <View
                  // Son siempre dos, en orden fijo: el indice es la identidad.
                  key={indice}
                  style={[
                    styles.barra,
                    valor > 0 && styles.barraMinima,
                    {
                      height: `${(valor / maximo) * 100}%`,
                      backgroundColor: colorDeTono(theme, series[indice]?.tono ?? 'neutral'),
                    },
                  ]}
                />
              ))}
            </View>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {mesCorto(mes)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bloque: { gap: theme.spacing.md },
    leyenda: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
    itemLeyenda: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    punto: { width: theme.spacing.sm, height: theme.spacing.sm, borderRadius: theme.radius.full },
    grafico: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    columna: { flex: 1, alignItems: 'center', gap: theme.spacing.xs },
    barras: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 2,
      width: '100%',
      height: theme.spacing.xxl * 2,
    },
    barra: {
      flex: 1,
      // Tope de ancho: con pocos meses, dos barras gordas se leen como bloques.
      maxWidth: theme.spacing.md,
      borderTopLeftRadius: theme.radius.sm,
      borderTopRightRadius: theme.radius.sm,
    },
    barraMinima: { minHeight: 2 },
  });
