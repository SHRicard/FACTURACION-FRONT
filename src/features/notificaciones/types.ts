import type { z } from 'zod';

import type {
  avisoAppSchema,
  avisosAppSchema,
  dataNotificacionSchema,
  dispositivoRegistradoSchema,
  tipoAvisoSchema,
} from './schemas';

// Tipos INFERIDOS de los schemas: una sola fuente de verdad.
export type TipoAviso = z.infer<typeof tipoAvisoSchema>;
export type AvisoApp = z.infer<typeof avisoAppSchema>;
export type AvisosApp = z.infer<typeof avisosAppSchema>;
export type DispositivoRegistrado = z.infer<typeof dispositivoRegistradoSchema>;
export type DataNotificacion = z.infer<typeof dataNotificacionSchema>;
