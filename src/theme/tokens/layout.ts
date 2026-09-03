/**
 * Tokens de layout responsive.
 *
 * ⚠️ Estos valores hablan de ANCHO DE VENTANA, no de plataforma. Un telefono en
 * horizontal, una tablet y una ventana de navegador angosta pueden caer todos en
 * el mismo breakpoint. Por eso en toda la app se decide por ancho y NUNCA con
 * `Platform.OS === 'web'`: si no, cada layout hay que arreglarlo dos veces.
 */

/** Ancho MINIMO (en dp/px) a partir del cual aplica cada breakpoint. */
export const breakpoints = {
  /** Telefono en vertical. Es el diseno base. */
  sm: 0,
  /** Telefono en horizontal, tablet chica, ventana angosta. */
  md: 600,
  /** Tablet en horizontal, laptop. */
  lg: 905,
  /** Monitor. */
  xl: 1240,
} as const;

/**
 * Anchos maximos de contenido, por tipo de contenido.
 *
 * Sin esto, en un monitor de 1920px un formulario se estira a todo el ancho y
 * queda ilegible. El limite no es estetico: una linea de texto comoda ronda los
 * 60-75 caracteres.
 */
export const maxWidth = {
  /** Formularios de una columna: login, registro, alta de factura. */
  formulario: 440,
  /** Texto corrido, fichas, detalle. */
  contenido: 760,
  /** Listados, tablas y dashboards, que si aprovechan el ancho. */
  ancho: 1128,
  /** Sin limite: ocupa todo lo disponible. */
  completo: 100000,
} as const;

export const layout = { breakpoints, maxWidth } as const;

export type Breakpoint = keyof typeof breakpoints;
export type MaxWidth = keyof typeof maxWidth;
export type Layout = typeof layout;
