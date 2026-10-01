import { StyleSheet } from 'react-native';

import type { Theme } from '@/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      // `width` explicito y no `alignSelf: 'stretch'`: varias pantallas lo montan
      // dentro de un padre con `alignItems: 'center'`, que si no lo encogeria al
      // ancho de su contenido.
      width: '100%',
      paddingHorizontal: theme.layout.margenPantalla,
    },
  });
