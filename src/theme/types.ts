import type { lightTheme } from './themes/lightTheme';

/**
 * Tokens semanticos de color. Se derivan de `lightTheme` (el molde) pero
 * ensanchados a `string`.
 *
 * Por que el ensanchado: la paleta de `tokens/colors.ts` esta declarada `as const`,
 * asi que `palette.white` no tiene tipo `string` sino el literal `'#FFFFFF'`. Si
 * `Theme` se derivara con un `typeof` pelado, `background` quedaria clavado en
 * `'#FFFFFF'` y `darkTheme` no podria apuntarlo a otro primitivo.
 */
export type ThemeColors = { [K in keyof typeof lightTheme.colors]: string };

/**
 * El tipo del theme. Vale para light y dark porque los dos tienen la misma forma:
 * `lightTheme` la define y `darkTheme` esta anotado `: Theme`, asi que si agregas
 * un token en uno, TypeScript te lo exige en el otro.
 *
 * `spacing` / `typography` / `radius` SI conservan sus tipos literales: los
 * necesita StyleSheet, que para muchos valores no acepta un `string` cualquiera.
 */
export type Theme = {
  colors: ThemeColors;
  spacing: (typeof lightTheme)['spacing'];
  typography: (typeof lightTheme)['typography'];
  radius: (typeof lightTheme)['radius'];
  layout: (typeof lightTheme)['layout'];
};

/** Preferencia del usuario. `system` sigue el modo del SO. */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Esquema efectivo que se esta renderizando. */
export type ColorScheme = 'light' | 'dark';
