import { memo, useMemo } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useEstiloCabecera, useTheme } from '@/theme';

import { BarraVolver } from '../BarraVolver';
import { Container } from '../Container';
import { Text } from '../Text';
import { createStyles } from './Pantalla.styles';
import type { PantallaProps } from './Pantalla.types';

/**
 * Marco de una pantalla: area segura, ancho maximo y encabezado.
 *
 * Existe para que las pantallas no repitan cada una su propio SafeAreaView +
 * Container + titulo, que es donde se cuelan los paddings y tamanos a mano.
 *
 * Solo protege el borde de ARRIBA: abajo esta la barra de tabs, que ya maneja
 * su propio inset. Si se protegieran los dos, quedaria un hueco vacio sobre la
 * barra.
 */
function PantallaComponent({
  titulo,
  descripcion,
  ancho = 'ancho',
  accion,
  onVolver,
  labelVolver,
  children,
  style,
}: PantallaProps) {
  const theme = useTheme();
  const { estilo: cabecera } = useEstiloCabecera();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Sin flecha no hay barra de navegacion, asi que el titulo grande va siempre:
  // el estilo compacto solo aplica a las pantallas de detalle.
  const tituloEnBarra = Boolean(onVolver) && cabecera.tituloEnBarra;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Container ancho={ancho} style={[styles.contenido, style]}>
        <View style={styles.cabecera}>
          {/*
            Con flecha de volver, la accion sube a la barra de navegacion y el
            titulo se queda con TODO el ancho. Si los tres comparten una sola
            fila, un nombre largo (el caso normal: es el nombre de un cliente)
            queda espichado en una columna angosta y se parte en tres lineas.
          */}
          {onVolver ? (
            <BarraVolver
              onVolver={onVolver}
              label={labelVolver}
              titulo={titulo}
              descripcion={descripcion}
              accion={accion}
            />
          ) : null}
          {/* En el estilo compacto el titulo ya lo dibujo la barra. */}
          {tituloEnBarra ? null : (
            <View style={styles.encabezado}>
              <View style={styles.titulos}>
                <Text variant="heading" weight="bold" accessibilityRole="header">
                  {titulo}
                </Text>
                {descripcion ? (
                  <Text variant="body" tone="muted">
                    {descripcion}
                  </Text>
                ) : null}
              </View>
              {/* Sin flecha (pantallas de tab) el titulo es corto y la accion
                  entra comoda al costado, centrada contra el bloque de texto. */}
              {onVolver ? null : accion}
            </View>
          )}
        </View>
        <View style={styles.cuerpo}>{children}</View>
      </Container>
    </SafeAreaView>
  );
}

export const Pantalla = memo(PantallaComponent);
