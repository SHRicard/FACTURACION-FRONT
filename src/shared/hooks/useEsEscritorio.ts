import { useTheme } from '@/theme';

import { useBreakpoint } from './useBreakpoint';

/**
 * Si la ventana da para la vista de ESCRITORIO.
 *
 * Pregunta por el ANCHO, no por la plataforma: una tablet nativa en horizontal
 * es escritorio, y un celular abierto en el navegador es movil. Partir por
 * `Platform.OS === 'web'` se equivoca en los dos casos, y los dos pasan de
 * verdad en un negocio que factura desde el mostrador.
 *
 * Es el unico lugar donde vive esa pregunta: el umbral es un token del theme
 * (`breakpointEscritorio`), asi que moverlo es cambiar un valor y nada mas.
 *
 * ⚠️ Esto NO es para ajustar anchos ni columnas —para eso estan `Container` y
 * el `elegir()` de `useBreakpoint`—. Es para el caso en que la pantalla es otra
 * composicion: una tabla en vez de tarjetas, un master-detail en vez de empujar
 * una pantalla nueva. Ver la seccion "Movil y escritorio" en CLAUDE.md.
 *
 * @example
 * export function ClientesScreen() {
 *   return useEsEscritorio() ? <ClientesEscritorio /> : <ClientesMovil />;
 * }
 */
export function useEsEscritorio(): boolean {
  const theme = useTheme();
  const { esAlMenos } = useBreakpoint();

  return esAlMenos(theme.layout.breakpointEscritorio);
}
