import type { z } from 'zod';

import type {
  coloresMarcaFormSchema,
  duenoSchema,
  estadisticasSchema,
  firmaLogoSchema,
  marcaFormSchema,
  marcaSchema,
  perfilFormSchema,
  respuestaIrmeSchema,
  respuestaPerfilSchema,
  sumarDuenoFormSchema,
  textosMarcaFormSchema,
} from './schemas';

// Tipos INFERIDOS de los schemas: una sola fuente de verdad.
export type Dueno = z.infer<typeof duenoSchema>;
export type Estadisticas = z.infer<typeof estadisticasSchema>;
export type Marca = z.infer<typeof marcaSchema>;
export type FirmaLogo = z.infer<typeof firmaLogoSchema>;
export type RespuestaPerfil = z.infer<typeof respuestaPerfilSchema>;
export type RespuestaIrme = z.infer<typeof respuestaIrmeSchema>;

export type PerfilForm = z.infer<typeof perfilFormSchema>;
export type SumarDuenoForm = z.infer<typeof sumarDuenoFormSchema>;
export type MarcaForm = z.infer<typeof marcaFormSchema>;
export type TextosMarcaForm = z.infer<typeof textosMarcaFormSchema>;
export type ColoresMarcaForm = z.infer<typeof coloresMarcaFormSchema>;

/**
 * Lo que se manda a `POST /marcas` y `PUT /marcas/mia`. Los colores van ya
 * normalizados; en la edicion, sin mandarlos quedan como estaban y `null` los
 * saca (el PDF vuelve a los colores de la app).
 */
export interface DatosMarca extends TextosMarcaForm {
  colorPrimario?: string | null;
  colorSecundario?: string | null;
}

/** Los dos colores mientras se eligen: como estan escritos, y ya leidos para la vista previa. */
export interface ColoresEnEdicion {
  primario: string;
  secundario: string;
  cambiar: (colores: { primario?: string; secundario?: string }) => void;
  errores: { primario?: string; secundario?: string };
  /** Normalizados, o null mientras el hex esta a medio escribir. */
  previa: { primario: string | null; secundario: string | null };
}
