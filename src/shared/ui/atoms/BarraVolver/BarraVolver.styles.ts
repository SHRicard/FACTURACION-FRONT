import { StyleSheet } from 'react-native';

import type { Theme } from '@/theme';

/** Ancho del contrapeso: lo mismo que mide un `BotonIcono`. */
const ANCHO_ACCION = 44;

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // 44px es el alto de una barra de navegacion de iOS. Cuando el titulo va
    // adentro con su bajada necesita un poco mas, y por eso es `minHeight`.
    barra: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
    },
    // Sin fondo ni contorno: en una barra de navegacion el boton es el glifo
    // suelto en el color de acento, y el feedback es la opacidad.
    volver: {
      flexDirection: 'row',
      alignItems: 'center',
      // Pegado al borde del contenido. El chevron dibuja centrado en su area
      // tocable, asi que sin esto queda flotando hacia adentro.
      marginLeft: -theme.spacing.sm,
      minHeight: 44,
      paddingRight: theme.spacing.xs,
      flexShrink: 1,
    },
    presionado: { opacity: 0.4 },
    // `shrink` para que un destino largo corte con puntos suspensivos en vez de
    // empujar la accion fuera de la pantalla.
    destino: { flexShrink: 1 },
    // El titulo adentro de la barra: centrado, y con la bajada abajo si la hay.
    centro: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xs,
    },
    // El hueco del ancho de la accion, para que el titulo del medio quede
    // centrado de verdad cuando la pantalla no tiene accion.
    contrapeso: { width: ANCHO_ACCION },
    // Empuja la accion a la derecha cuando el titulo NO esta en la barra.
    separador: { flex: 1 },
  });
