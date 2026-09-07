import { StyleSheet } from 'react-native';

import type { Theme } from '@/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    // El Container se centra solo; el flex es para que el contenido de abajo
    // (una lista, un estado vacio) pueda estirarse a lo que sobra.
    contenido: { flex: 1, gap: theme.spacing.lg, paddingTop: theme.spacing.sm },
    // Fila de navegacion y titulo van juntos y pegados entre si: el `gap: lg`
    // del contenido es la separacion con el cuerpo, no con la flecha.
    cabecera: { gap: theme.spacing.sm },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    // `flex: 1` para que el titulo se quede con todo el ancho libre en vez de
    // encogerse contra la accion.
    titulos: { flex: 1, gap: theme.spacing.xs },
    cuerpo: { flex: 1 },
  });
