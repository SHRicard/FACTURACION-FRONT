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
  /**
   * Listados, tablas y dashboards. El techo es alto a proposito: en una pantalla
   * normal gana el 90% (`anchoUtil`) y este limite solo entra a jugar en un
   * monitor ultrawide, para que el contenido no quede desparramado.
   */
  ancho: 1600,
  /** Sin limite: ocupa todo lo disponible. */
  completo: 100000,
} as const;

/**
 * Porcentaje del ancho de pantalla que ocupa el contenido.
 *
 * El 10% restante son los margenes laterales. Es lo que hace que la app se vea
 * "llena" en un monitor en vez de una columna angosta en el medio, sin dejar el
 * contenido pegado a los bordes.
 */
export const anchoUtil = '90%';

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
  maxWidth,
  anchoUtil,
  alturaBarraTabs,
  breakpointEscritorio,
} as const;

export type Breakpoint = keyof typeof breakpoints;
export type MaxWidth = keyof typeof maxWidth;
export type Layout = typeof layout;
