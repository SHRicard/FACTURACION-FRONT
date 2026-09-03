import { layout, palette, radius, spacing, typography } from '../tokens';

/**
 * Tokens SEMANTICOS (modo claro): nombrados por lo que significan.
 * Es lo unico que consumen los componentes, via `useTheme()`.
 *
 * De este objeto sale el tipo `Theme` (ver `theme/types.ts`), asi que hace de
 * molde: `darkTheme` esta tipado como `Theme` y TypeScript le exige la misma forma.
 */
export const lightTheme = {
  colors: {
    primary: palette.blue500,
    primaryPressed: palette.blue600,
    onPrimary: palette.white,

    background: palette.white,
    surface: palette.gray100,
    /** Fondo oscurecido detras de un modal. */
    overlay: palette.veloClaro,
    border: palette.gray200,

    text: palette.black,
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
