import type { Href } from 'expo-router';

/** Los tabs del area de administrador, en el orden en que estan en la barra. */
export type TabAdmin = 'index' | 'facturas' | 'clientes' | 'cuenta';

export interface Paso {
  /**
   * Identifica al paso. No se renombra ni se reusa: si mas adelante hay que
   * saber que pasos concretos vio cada persona, este es el dato que queda.
   */
  id: string;
  titulo: string;
  texto: string;
  /**
   * Tab que se resalta mientras el paso esta a la vista. Sin esto el paso se
   * muestra sin halo, que es lo correcto para una bienvenida o un cierre.
   */
  tab?: TabAdmin;
  /** A donde lleva el boton. Sin destino, el boton solo avanza. */
  destino?: Href;
  /** Texto del boton principal. Por defecto, "Siguiente". */
  accion?: string;
}
