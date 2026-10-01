import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { colorDeTono, type TonoMetrica } from './tonos';

export interface PuntoGrafico {
  clave: string;
  /** Lo que va debajo de la barra: "abr", "31/08". */
  etiqueta: string;
  valor: number;
  /** Como lo lee el lector de pantalla, y el detalle del punto tocado. */
  descripcion: string;
}

interface GraficoBarrasProps {
  puntos: readonly PuntoGrafico[];
  tono: TonoMetrica;
  /** La barra elegida va entera; las demas, apagadas. */
  elegida?: string | null;
  /** Con esto las barras se tocan: el detalle del punto va debajo del grafico. */
  onElegir?: (clave: string) => void;
}

/**
 * Con mas barras que esto, las etiquetas no entran debajo de cada una (26
 * semanas en 6 meses): se muestran la primera y la ultima, y el detalle del
 * punto tocado dice cual es cada una.
 */
const ETIQUETAS_MAXIMAS = 8;

/**
 * Una barra por punto, todas contra el mismo maximo: un mes flojo se ve flojo al
 * lado de uno bueno. Los puntos en cero tambien van: un hueco dice algo.
 */
function GraficoBarrasComponent({ puntos, tono, elegida = null, onElegir }: GraficoBarrasProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  // El 1 evita dividir por cero cuando todo el periodo esta en cero.
  const maximo = Math.max(1, ...puntos.map((punto) => punto.valor));
  const denso = puntos.length > ETIQUETAS_MAXIMAS;
  const color = colorDeTono(theme, tono);

  return (
    <View style={styles.bloque}>
      <View style={styles.barras}>
        {puntos.map((punto) => {
          const esElegida = punto.clave === elegida;

          const contenido = (
            <>
              <View style={styles.pista}>
                <View
                  style={[
                    styles.barra,
                    punto.valor > 0 && styles.barraMinima,
                    { height: `${(punto.valor / maximo) * 100}%`, backgroundColor: color },
                    elegida !== null && !esElegida && styles.apagada,
                  ]}
                />
              </View>
              {denso ? null : (
                <Text
                  variant="caption"
                  tone={esElegida ? 'default' : 'muted'}
                  weight={esElegida ? 'bold' : 'regular'}
                  numberOfLines={1}
                >
                  {punto.etiqueta}
                </Text>
              )}
            </>
          );

          if (!onElegir) {
            return (
              <View
                key={punto.clave}
                style={styles.columna}
                accessible
                accessibilityLabel={punto.descripcion}
              >
                {contenido}
              </View>
            );
          }

          return (
            <Pressable
              key={punto.clave}
              onPress={() => onElegir(punto.clave)}
              style={styles.columna}
              accessibilityRole="button"
              accessibilityLabel={punto.descripcion}
              accessibilityState={{ selected: esElegida }}
            >
              {contenido}
            </Pressable>
          );
        })}
      </View>

      {denso ? (
        <View style={styles.extremos}>
          <Text variant="caption" tone="muted">
            {puntos[0]?.etiqueta}
          </Text>
          <Text variant="caption" tone="muted">
            {puntos[puntos.length - 1]?.etiqueta}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const GraficoBarras = memo(GraficoBarrasComponent);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bloque: { gap: theme.spacing.xs },
    barras: {
      flexDirection: 'row',
      gap: 2,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    columna: { flex: 1, alignItems: 'center', gap: theme.spacing.xs },
    pista: {
      justifyContent: 'flex-end',
      alignItems: 'center',
      width: '100%',
      height: theme.spacing.xxl * 2,
    },
    barra: {
      width: '70%',
      // Tope de ancho: con pocos puntos, una barra gorda se lee como un bloque.
      maxWidth: theme.spacing.lg,
      borderTopLeftRadius: theme.radius.sm,
      borderTopRightRadius: theme.radius.sm,
    },
    barraMinima: { minHeight: 2 },
    apagada: { opacity: 0.35 },
    extremos: { flexDirection: 'row', justifyContent: 'space-between' },
  });
