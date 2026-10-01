import { Platform } from 'react-native';

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
  /**
   * Monoespaciada del sistema, para lo que se lee caracter por caracter: el
   * stack de un error, una huella. No sigue al par elegido: ninguna de las
   * familias del par es monoespaciada.
   */
  mono: string;
};

export const typography: Typography = {
  size: {
    caption: 12,
    body: 16,
    title: 22,
    heading: 28,
  },
  family: paresTipograficos[PAR_TIPOGRAFICO_POR_DEFECTO].family,
  // Las fuentes SI son de la plataforma: iOS no trae ninguna llamada `monospace`.
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
};
