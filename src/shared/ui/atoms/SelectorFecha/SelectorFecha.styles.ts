import { StyleSheet } from 'react-native';

import type { Theme } from '@/theme';

/** Un septimo exacto: siete dias por fila, sin que el redondeo mande uno abajo. */
const ANCHO_DIA = `${100 / 7}%` as const;

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    calendario: {
      gap: theme.spacing.sm,
      padding: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    encabezado: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    mes: { flex: 1, textAlign: 'center', textTransform: 'capitalize' },
    flecha: {
      // Touch target accesible aunque el icono sea chico.
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.full,
    },
    apagada: { opacity: 0.3 },
    semana: { flexDirection: 'row' },
    diaSemana: { width: ANCHO_DIA, textAlign: 'center' },
    grilla: { flexDirection: 'row', flexWrap: 'wrap' },
    celda: { width: ANCHO_DIA, aspectRatio: 1, padding: 2 },
    dia: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.full,
    },
    hoy: { borderWidth: 1, borderColor: theme.colors.primary },
    elegido: { backgroundColor: theme.colors.primary },
    deshabilitado: { opacity: 0.3 },
    presionado: { opacity: 0.6 },
  });
