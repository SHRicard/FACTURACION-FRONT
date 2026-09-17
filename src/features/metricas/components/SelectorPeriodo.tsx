import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { textoPeriodo } from '../formato';
import { PERIODOS, type ClavePeriodo } from '../periodo';
import type { Periodo } from '../types';
import { SelectorOpciones } from './SelectorOpciones';

interface SelectorPeriodoProps {
  activo: ClavePeriodo;
  onCambiar: (clave: ClavePeriodo) => void;
  /**
   * El periodo que devolvio la API. Se muestra debajo para que no haya duda de
   * que se esta mirando: "Ultimos 3 meses" arranca el 1 del mes, no hace 90 dias.
   */
  periodo?: Periodo;
  /** Se esta pidiendo el periodo nuevo: lo de abajo todavia es el anterior. */
  actualizando?: boolean;
  /** Aclaracion del periodo cuando no es el obvio (pagos a tiempo: el de vencimiento). */
  nota?: string;
}

/** El selector de periodo de todas las metricas que miran un rango de fechas. */
export function SelectorPeriodo({
  activo,
  onCambiar,
  periodo,
  actualizando = false,
  nota,
}: SelectorPeriodoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.bloque}>
      <SelectorOpciones
        opciones={PERIODOS}
        activa={activo}
        onCambiar={onCambiar}
        etiqueta="Período"
      />
      <View style={styles.rango}>
        {periodo ? (
          <Text variant="caption" tone="muted" style={styles.texto}>
            {nota ? `${nota} ` : 'Del '}
            {textoPeriodo(periodo)}
          </Text>
        ) : null}
        {actualizando ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bloque: { gap: theme.spacing.xs },
    rango: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, minHeight: 20 },
    texto: { flexShrink: 1 },
  });
