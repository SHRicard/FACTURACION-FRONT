import type { Theme } from '../types';
import { layout, palette, radius, spacing, typography } from '../tokens';

/**
 * Tokens SEMANTICOS (modo oscuro). Misma forma que `lightTheme`:
 * lo unico que cambia es a que primitivo apunta cada semantico.
 */
export const darkTheme: Theme = {
  colors: {
    primary: palette.blue500,
    primaryPressed: palette.blue200,
    onPrimary: palette.white,

    background: palette.gray900,
    surface: palette.gray800,
    /** Fondo oscurecido detras de un modal. */
    overlay: palette.veloOscuro,
    border: palette.gray700,

    text: palette.white,
    textMuted: palette.gray500,

    error: palette.red500,
    success: palette.green500,
    warning: palette.amber500,
  },
  spacing,
  typography,
  radius,
  // No cambia entre claro y oscuro, pero vive en el theme para que TODO salga
  // del mismo lugar: useTheme().
  layout,
};
