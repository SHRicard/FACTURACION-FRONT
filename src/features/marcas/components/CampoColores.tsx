import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import type { ColoresEnEdicion } from '../types';

import { SelectorColores } from './SelectorColores';
import { VistaPreviaColores } from './VistaPreviaColores';

interface CampoColoresProps {
  nombreMarca: string;
  colores: ColoresEnEdicion;
  /** En el alta va con etiqueta de campo; en el modal, el titulo ya lo dice. */
  conEtiqueta?: boolean;
}

/** Elegir los colores y ver en el momento como sale la factura. */
export function CampoColores({ nombreMarca, colores, conEtiqueta = false }: CampoColoresProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.campo}>
      {conEtiqueta ? (
        <Text variant="caption" weight="medium" tone="muted">
          Colores de tu factura
        </Text>
      ) : null}
      <SelectorColores colores={colores} />
      <VistaPreviaColores
        nombreMarca={nombreMarca}
        primario={colores.previa.primario}
        secundario={colores.previa.secundario}
      />
      <Text variant="caption" tone="muted">
        Si un color es muy claro, en los textos se oscurece para que tu cliente lo pueda leer.
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    campo: { gap: theme.spacing.sm },
  });
