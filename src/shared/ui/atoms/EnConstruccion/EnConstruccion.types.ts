export interface EnConstruccionProps {
  /** Que pantalla es. Va en el encabezado, para no perder de vista donde estas. */
  titulo: string;
  /**
   * Que va a haber aca cuando este lista. Sin esto va un texto generico que
   * ademas explica como seguir usando la app mientras tanto.
   */
  descripcion?: string;
}
