import { StyleSheet } from 'react-native';

import type { Theme } from '@/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    raiz: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.overlay,
    },
    /**
     * El velo es un hermano ABSOLUTO detras de la tarjeta, no su padre.
     *
     * Anidar la tarjeta dentro de un Pressable no sirve: el sistema de responder
     * de React Native deja que el padre gane igual, asi que un toque dentro del
     * modal lo cerraba. Como hermano, un toque en la tarjeta nunca llega al velo.
     */
    velo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    /**
     * El ancho se limita ACA y no en la tarjeta: si la tarjeta pide `width: 100%`
     * dentro de un contenedor que se dimensiona por su contenido, el calculo es
     * circular y React Native lo resuelve estirandola a la pantalla completa,
     * comiendose el padding.
     */
    contenedor: {
      width: '100%',
      // Que no se estire a lo ancho en tablets.
      maxWidth: 440,
    },
    tarjeta: {
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      elevation: 8,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    textoEncabezado: { flex: 1, gap: theme.spacing.xs },
    cerrar: {
      // Touch target accesible aunque el icono sea chico.
      width: 44,
      height: 44,
      marginTop: -theme.spacing.sm,
      marginRight: -theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.full,
    },
    acciones: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
    },
  });
