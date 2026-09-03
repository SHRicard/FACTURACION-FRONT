/** Escala de espaciado (base 4/8). Nunca uses numeros sueltos en un componente. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export type Spacing = typeof spacing;
