import type { z } from 'zod';

import type {
  bajaCuentaSchema,
  documentoLegalSchema,
  seccionLegalSchema,
  tipoDocumentoSchema,
} from './schemas';

/** Los documentos de texto: terminos y privacidad. */
export type TipoDocumento = z.infer<typeof tipoDocumentoSchema>;
export type SeccionLegal = z.infer<typeof seccionLegalSchema>;
export type DocumentoLegal = z.infer<typeof documentoLegalSchema>;
export type BajaCuenta = z.infer<typeof bajaCuentaSchema>;

/** Todo lo que vive bajo `/legal`, para el mapa de rutas. */
export type RutaLegal = TipoDocumento | 'eliminar-cuenta';
