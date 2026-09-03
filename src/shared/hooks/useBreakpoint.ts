import { useCallback, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { useTheme, type Breakpoint } from '@/theme';

/** De menor a mayor. El orden importa para resolver el breakpoint activo. */
const ORDEN: readonly Breakpoint[] = ['sm', 'md', 'lg', 'xl'];

/**
 * Valores por breakpoint, mobile-first: `sm` es obligatorio porque es la base,
 * y los demas son opcionales (solo declaras donde cambia algo).
 */
export type ValoresPorBreakpoint<T> = Partial<Record<Breakpoint, T>> & { sm: T };

/**
 * Breakpoint activo segun el ANCHO DE VENTANA (no la plataforma).
 *
 * Se actualiza solo al rotar el dispositivo o redimensionar el navegador,
 * porque `useWindowDimensions` es reactivo.
 *
 * @example
 * const { esAlMenos, elegir } = useBreakpoint();
 * const columnas = elegir({ sm: 1, md: 2, xl: 3 });
 * if (esAlMenos('lg')) { ... }
 */
export function useBreakpoint() {
  const theme = useTheme();
  const { width: ancho } = useWindowDimensions();
  const { breakpoints } = theme.layout;

  const breakpoint = useMemo<Breakpoint>(() => {
    let actual: Breakpoint = 'sm';
    for (const bp of ORDEN) {
      if (ancho >= breakpoints[bp]) actual = bp;
    }
    return actual;
  }, [ancho, breakpoints]);

  /** true si la ventana esta en ese breakpoint o en uno mas ancho. */
  const esAlMenos = useCallback((bp: Breakpoint) => ancho >= breakpoints[bp], [ancho, breakpoints]);

  /**
   * Elige el valor del breakpoint activo, cayendo al mas cercano hacia abajo.
   * Con `{ sm: 1, lg: 3 }` en una ventana `md` devuelve 1, porque `md` no esta
   * definido y el anterior declarado es `sm`.
   */
  const elegir = useCallback(
    <T>(valores: ValoresPorBreakpoint<T>): T => {
      let elegido: T = valores.sm;
      for (const bp of ORDEN) {
        if (ancho >= breakpoints[bp] && valores[bp] !== undefined) {
          elegido = valores[bp] as T;
        }
      }
      return elegido;
    },
    [ancho, breakpoints],
  );

  return { breakpoint, ancho, esAlMenos, elegir };
}
