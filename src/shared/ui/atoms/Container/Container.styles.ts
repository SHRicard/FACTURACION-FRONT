import { StyleSheet } from 'react-native';

export const createStyles = () =>
  StyleSheet.create({
    base: {
      // Centrado: en una ventana ancha el contenido queda al medio, no pegado
      // a la izquierda.
      alignSelf: 'center',
    },
  });
