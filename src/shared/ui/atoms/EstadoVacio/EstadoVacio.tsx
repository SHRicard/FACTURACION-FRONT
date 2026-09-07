import { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from '../Text';
import { createStyles } from './EstadoVacio.styles';
import type { EstadoVacioProps } from './EstadoVacio.types';

/**
 * Lo que se muestra cuando una lista no tiene nada.
 *
 * No es lo mismo que un error: aca no se rompio nada, simplemente todavia no
 * hay datos. Por eso siempre lleva texto y no solo un dibujo — un icono suelto
 * no le dice nada a un lector de pantalla ni a quien no lo interpreta igual.
 */
function EstadoVacioComponent({ icono, titulo, descripcion, accion }: EstadoVacioProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.base} accessible accessibilityRole="summary">
      {/* El icono es decorativo: lo que se lee es el titulo. */}
      {icono ? (
        <View
          style={styles.icono}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {icono}
        </View>
      ) : null}
      <Text variant="title" weight="bold" center>
        {titulo}
      </Text>
      {descripcion ? (
        <Text variant="body" tone="muted" center>
          {descripcion}
        </Text>
      ) : null}
      {accion ? <View style={styles.accion}>{accion}</View> : null}
    </View>
  );
}

export const EstadoVacio = memo(EstadoVacioComponent);
