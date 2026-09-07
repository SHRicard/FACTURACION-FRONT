import { StyleSheet } from 'react-native';

import type { Theme } from '@/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.lg,
    },
    // Separa el icono del texto un poco mas que el resto del bloque.
    icono: { marginBottom: theme.spacing.xs },
    accion: { marginTop: theme.spacing.md },
  });
