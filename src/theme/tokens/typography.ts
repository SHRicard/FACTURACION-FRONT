import {
  PAR_TIPOGRAFICO_POR_DEFECTO,
  paresTipograficos,
  type FamiliasTipograficas,
} from './tipografias';

export type Typography = {
  size: { caption: number; body: number; title: number; heading: number };
  /**
   * Familias del par tipografico ACTIVO. No es una constante: el ThemeProvider
   * la reemplaza segun lo que haya elegido el cliente. Los componentes no se
   * enteran, siguen pidiendo `theme.typography.family.text.bold`.
   */
  family: FamiliasTipograficas;
};

export const typography: Typography = {
  size: {
    caption: 12,
    body: 16,
    title: 22,
    heading: 28,
  },
  family: paresTipograficos[PAR_TIPOGRAFICO_POR_DEFECTO].family,
};
