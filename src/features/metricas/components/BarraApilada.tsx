import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { formatearCantidad } from '../formato';
import { colorDeTono, type TonoMetrica } from './tonos';

export interface Segmento {
  clave: string;
  etiqueta: string;
  valor: number;
  tono: TonoMetrica;
}

interface BarraApiladaProps {
  segmentos: readonly Segmento[];
  /** `fina` para una fila de lista; `gruesa` para el resumen de arriba. */
  grosor?: 'fina' | 'gruesa';
  /** La leyenda con el color y la cantidad de cada parte. */
  conLeyenda?: boolean;
}

/**
 * Una barra partida en pedazos proporcionales: a tiempo / tarde / impagas.
 *
 * Los pedazos en cero no se dibujan, pero siguen en la leyenda: "0 impagas" es
 * un dato, no un hueco.
 */
export function BarraApilada({
  segmentos,
  grosor = 'gruesa',
  conLeyenda = false,
}: BarraApiladaProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const resumen = segmentos.map((s) => `${formatearCantidad(s.valor)} ${s.etiqueta}`).join(', ');

  return (
    <View style={styles.bloque} accessible accessibilityLabel={resumen}>
      <View style={[styles.pista, grosor === 'fina' ? styles.fina : styles.gruesa]}>
        {segmentos
          .filter((s) => s.valor > 0)
          .map((s) => (
            <View
              key={s.clave}
              style={{ flexGrow: s.valor, backgroundColor: colorDeTono(theme, s.tono) }}
            />
          ))}
      </View>

      {conLeyenda ? (
        <View style={styles.leyenda}>
          {segmentos.map((s) => (
            <View key={s.clave} style={styles.itemLeyenda}>
              <View style={[styles.punto, { backgroundColor: colorDeTono(theme, s.tono) }]} />
              <Text variant="caption" tone="muted">
                {s.etiqueta}{' '}
                <Text variant="caption" weight="bold">
                  {formatearCantidad(s.valor)}
                </Text>
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bloque: { gap: theme.spacing.sm },
    pista: {
      flexDirection: 'row',
      gap: 2,
      overflow: 'hidden',
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.border,
    },
    fina: { height: theme.spacing.xs + 2 },
    gruesa: { height: theme.spacing.md },
    leyenda: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
    itemLeyenda: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    punto: { width: theme.spacing.sm, height: theme.spacing.sm, borderRadius: theme.radius.full },
  });
