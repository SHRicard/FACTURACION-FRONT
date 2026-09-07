/** Los tres estilos de cabecera entre los que puede elegir el cliente. */
export type ClaveEstiloCabecera = 'destino' | 'chevron' | 'compacta';

export type EstiloCabecera = {
  /** Como se llama en el selector. */
  nombre: string;
  /** Una linea que explica en que se diferencia. */
  descripcion: string;
  /**
   * Si al lado del chevron va el nombre de la pantalla de la que venis
   * ("Clientes"). Es la unica forma de saber a donde lleva el gesto de volver.
   */
  conDestino: boolean;
  /**
   * Si el titulo de la pantalla va DENTRO de la barra de navegacion, chico y
   * centrado, en vez de grande debajo. Gana el alto del titulo grande para el
   * contenido, a cambio de que un titulo largo se corte.
   */
  tituloEnBarra: boolean;
};

/**
 * Catalogo de estilos de cabecera de las pantallas de detalle.
 *
 * Los tres son la misma barra de 44px con distinto contenido: chevron a la
 * izquierda, accion a la derecha, las dos sin fondo ni recuadro. Lo unico que
 * cambia es donde va el titulo y si se dice a donde volves.
 *
 * Vive en el theme, al lado de `estilosTabs`, porque es lo mismo: una
 * preferencia de apariencia que elige el cliente y se guarda en el storage.
 */
export const estilosCabecera: Record<ClaveEstiloCabecera, EstiloCabecera> = {
  destino: {
    nombre: 'Con destino',
    descripcion: 'El chevron dice a donde volves y el titulo va grande abajo.',
    conDestino: true,
    tituloEnBarra: false,
  },
  chevron: {
    nombre: 'Chevron solo',
    descripcion: 'Sin la palabra al lado. La barra queda simetrica y el titulo se luce.',
    conDestino: false,
    tituloEnBarra: false,
  },
  compacta: {
    nombre: 'Titulo en la barra',
    descripcion: 'Todo en un renglon. El contenido arranca mucho mas arriba.',
    conDestino: false,
    tituloEnBarra: true,
  },
};

/** El orden en que se listan en el selector. */
export const CLAVES_ESTILOS_CABECERA = Object.keys(estilosCabecera) as ClaveEstiloCabecera[];

export const ESTILO_CABECERA_POR_DEFECTO: ClaveEstiloCabecera = 'destino';

export const esClaveEstiloCabecera = (
  valor: string | null | undefined,
): valor is ClaveEstiloCabecera => valor != null && valor in estilosCabecera;
