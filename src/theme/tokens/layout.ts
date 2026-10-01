import { spacing } from './spacing';

/**
 * Tokens de layout responsive.
 *
 * ⚠️ Estos valores hablan de ANCHO DE VENTANA, no de plataforma. Un telefono en
 * horizontal, una tablet y una ventana de navegador angosta pueden caer todos en
 * el mismo breakpoint. Por eso en toda la app se decide por ancho y NUNCA con
 * `Platform.OS === 'web'`: si no, cada layout hay que arreglarlo dos veces.
 *
 * Eso vale tambien para la vista de escritorio, que algun dia va a ser una
 * composicion distinta y no un reflow: el corte lo marca `breakpointEscritorio`,
 * no la plataforma. Una tablet nativa en horizontal es escritorio, y un celular
 * abierto en el navegador es movil.
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
 * Margen a cada costado del contenido de una pantalla.
 *
 * La app es movil: el contenido ocupa TODO el ancho menos este margen, en
 * cualquier telefono. Es fijo y no un porcentaje ni un tope de ancho a proposito:
 * con un tope, en un telefono grande o un plegable el formulario quedaba como
 * una columna angosta en el medio, y con un porcentaje el margen crece con la
 * pantalla y se come lugar que el contenido necesita.
 */
export const margenPantalla = spacing.lg;

/**
 * Alto BASE de la barra de tabs, SIN contar el area segura de abajo.
 *
 * Se fija a mano (en vez de dejar el default del navegador) porque no lo usa
 * solo la barra: cualquier cosa que flote justo encima —hoy la hoja del tour—
 * necesita el mismo numero para no quedar tapada. Con el default habria que
 * medirlo, y una medicion que llega un frame tarde se ve como un salto.
 *
 * De aca sale el alto de cada estilo de barra (ver `tokens/tabs.ts`). Lo que
 * ocupa la barra de verdad en pantalla lo calcula `espacioDeBarra`, que ademas
 * suma los margenes del estilo elegido y el area segura.
 */
export const alturaBarraTabs = 60;

/**
 * A partir de este breakpoint la app usa la vista de ESCRITORIO.
 *
 * `lg` (905px) es "tablet en horizontal, laptop": el ancho donde entra un
 * sidebar mas una lista mas un detalle sin que ninguno quede espichado.
 *
 * Es un token y no un `'lg'` suelto adentro de un hook porque mover el umbral
 * tiene que ser cambiar un valor en un lugar, no ir a buscar comparaciones
 * desparramadas por el codigo. Lo lee `useEsEscritorio`.
 */
export const breakpointEscritorio: Breakpoint = 'lg';

export const layout = {
  breakpoints,
  margenPantalla,
  alturaBarraTabs,
  breakpointEscritorio,
} as const;

export type Breakpoint = keyof typeof breakpoints;
export type Layout = typeof layout;
