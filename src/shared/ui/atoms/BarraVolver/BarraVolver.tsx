import { ChevronLeft } from 'lucide-react-native';
import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { useEstiloCabecera, useTheme } from '@/theme';

import { Text } from '../Text';
import { createStyles } from './BarraVolver.styles';
import type { BarraVolverProps } from './BarraVolver.types';

/**
 * Barra de navegacion de una pantalla: volver a la izquierda, accion a la
 * derecha, en los tres estilos que puede elegir el cliente (ver
 * `estilosCabecera` en el theme y el selector en Configuracion).
 *
 * Las pantallas de la app no usan el header nativo del navegador, asi que el
 * "atras" se dibuja aca. Va con chevron y no con flecha porque la flecha es de
 * Android: el chevron es lo que hace que la barra se lea como la de un iPhone.
 *
 * Normalmente no se usa suelta: la monta `Pantalla` cuando recibe `onVolver`.
 */
function BarraVolverComponent({
  onVolver,
  label,
  titulo,
  descripcion,
  accion,
  accessibilityLabel,
  style,
}: BarraVolverProps) {
  const theme = useTheme();
  const { estilo } = useEstiloCabecera();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const destino = estilo.conDestino ? label : undefined;
  const enBarra = estilo.tituloEnBarra && titulo !== undefined;

  return (
    <View style={[styles.barra, style]}>
      <Pressable
        onPress={onVolver}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (destino ? `Volver a ${destino}` : 'Volver')}
        hitSlop={theme.spacing.sm}
        style={({ pressed }) => [styles.volver, pressed && styles.presionado]}
      >
        <ChevronLeft size={28} color={theme.colors.primary} strokeWidth={2.2} />
        {destino ? (
          <Text variant="body" tone="primary" numberOfLines={1} style={styles.destino}>
            {destino}
          </Text>
        ) : null}
      </Pressable>

      {enBarra ? (
        <View style={styles.centro}>
          <Text variant="body" weight="bold" numberOfLines={1} accessibilityRole="header">
            {titulo}
          </Text>
          {descripcion ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {descripcion}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.separador} />
      )}

      {accion}
      {/* Sin accion, el titulo del medio quedaria corrido a la derecha. */}
      {enBarra && !accion ? <View style={styles.contrapeso} /> : null}
    </View>
  );
}

export const BarraVolver = memo(BarraVolverComponent);
