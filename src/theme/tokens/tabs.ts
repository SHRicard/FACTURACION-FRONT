import { alturaBarraTabs } from './layout';
import { radius } from './radius';
import { spacing } from './spacing';

/** Diametro de la burbuja que sigue al tab activo en el estilo `burbuja`. */
export const DIAMETRO_BURBUJA_TABS = 48;

/** Los tres estilos de barra inferior entre los que puede elegir el cliente. */
export type ClaveEstiloTabs = 'vidrio' | 'flotante' | 'burbuja';

export type EstiloTabs = {
  /** Como se llama en el selector. */
  nombre: string;
  /** Una linea que explica en que se diferencia. */
  descripcion: string;
  /** Alto de la barra en si, SIN el area segura de abajo. */
  alto: number;
  /**
   * Aire reservado ARRIBA de la barra. Solo lo usa el estilo de la burbuja: la
   * burbuja se monta a caballo del borde y esta es la mitad que le sobresale.
   * Sin reservarlo, Android la recorta.
   */
  margenSuperior: number;
  /** Cuanto se despega de los bordes laterales. 0 = pegada. */
  margenLateral: number;
  /** Cuanto se despega del piso (por arriba del area segura). */
  margenInferior: number;
  radio: number;
  /**
   * Si el icono del tab activo se levanta de la barra a una burbuja que se
   * desliza hasta quedar encima de ese tab.
   */
  conBurbuja: boolean;
};

/**
 * Catalogo de estilos de la barra de tabs.
 *
 * Los tres marcan el tab activo igual —el icono pasa de linea a relleno, que se
 * lee sin depender del color—; lo que cambia es la forma de la barra.
 *
 * Vive en el theme y no en el componente porque no lo usa solo la barra: la
 * hoja del tour se apoya justo encima y necesita la misma geometria para poner
 * el halo donde va.
 */
export const estilosTabs: Record<ClaveEstiloTabs, EstiloTabs> = {
  vidrio: {
    nombre: 'Al piso',
    descripcion: 'Pegada al borde de abajo, como la de iPhone. Es la mas sobria.',
    alto: alturaBarraTabs,
    margenSuperior: 0,
    margenLateral: 0,
    margenInferior: 0,
    radio: 0,
    conBurbuja: false,
  },
  flotante: {
    nombre: 'Flotante',
    descripcion: 'Una capsula despegada de los bordes, con sombra. La mas moderna.',
    alto: alturaBarraTabs + spacing.xs,
    margenSuperior: 0,
    margenLateral: spacing.md,
    margenInferior: spacing.sm,
    radio: radius.full,
    conBurbuja: false,
  },
  burbuja: {
    nombre: 'Con burbuja',
    descripcion: 'El icono de donde estas se levanta de la barra y se desliza al cambiar de tab.',
    alto: alturaBarraTabs,
    margenSuperior: DIAMETRO_BURBUJA_TABS / 2,
    margenLateral: 0,
    margenInferior: 0,
    radio: 0,
    conBurbuja: true,
  },
};

/** El orden en que se listan en el selector. */
export const CLAVES_ESTILOS_TABS = Object.keys(estilosTabs) as ClaveEstiloTabs[];

export const ESTILO_TABS_POR_DEFECTO: ClaveEstiloTabs = 'flotante';

export const esClaveEstiloTabs = (valor: string | null | undefined): valor is ClaveEstiloTabs =>
  valor != null && valor in estilosTabs;
