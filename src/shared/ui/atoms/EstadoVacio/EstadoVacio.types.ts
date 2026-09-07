import type { ReactNode } from 'react';

export interface EstadoVacioProps {
  /**
   * Ilustra el vacio. Se pasa ya renderizado (ej. `<Inbox />`) para que el atom
   * no dependa de ninguna libreria de iconos.
   */
  icono?: ReactNode;
  /** Que es lo que no hay, en positivo. Ej. "Todavia no hay facturas". */
  titulo: string;
  /** Como salir del vacio. Ej. "Crea la primera y va a aparecer aca". */
  descripcion?: string;
  /** Boton para resolverlo, si hay uno. */
  accion?: ReactNode;
}
