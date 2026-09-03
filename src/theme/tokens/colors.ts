/**
 * Tokens PRIMITIVOS de color: la paleta cruda, nombrada por lo que es.
 * No se usan directo en los componentes -> para eso estan los semanticos
 * de `theme/themes/`.
 */
export const palette = {
  blue500: '#2D6CDF',
  blue600: '#1F4FB0',
  blue200: '#A8C4F5',

  white: '#FFFFFF',
  black: '#1A1A1A',

  gray100: '#F2F2F2',
  gray200: '#E3E3E3',
  gray500: '#8A8A8A',
  gray700: '#3D3D3D',
  gray800: '#2A2A2A',
  gray900: '#141414',

  // Velos para el fondo de modales. Van en rgba: necesitan transparencia.
  veloClaro: 'rgba(0, 0, 0, 0.45)',
  veloOscuro: 'rgba(0, 0, 0, 0.65)',

  red500: '#E24B4A',
  green500: '#2EA043',
  amber500: '#D98A0B',
} as const;

export type Palette = typeof palette;
