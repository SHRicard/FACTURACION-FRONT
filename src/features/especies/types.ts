import type { z } from 'zod';

import type { especieFormSchema, especieSchema } from './schemas';

export type Especie = z.infer<typeof especieSchema>;
export type EspecieForm = z.infer<typeof especieFormSchema>;

/** Lo que viaja al backend en el alta y en la edicion. */
export interface DatosEspecie {
  nombre: string;
  descripcion?: string;
}

/**
 * Lo que acepta el PUT. Ademas de los datos del formulario, el interruptor de
 * la lista: es el mismo endpoint.
 */
export type CambiosEspecie = Partial<DatosEspecie & { activo: boolean }>;

/**
 * Quien esta usando una especie que se quiso borrar. Los dos conteos vienen en
 * el `detalles` del 400.
 */
export interface UsosEspecie {
  /** Tickets que la nombran. */
  tickets: number;
  /** Productos de la lista de precios de esa especie. */
  productos: number;
}
