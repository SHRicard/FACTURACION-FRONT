import { z } from 'zod';

/**
 * Schemas de los avisos (docs/NOTIFICACIONES.md, 10).
 *
 * Criterio K8: un tipo nuevo del backend se lee como 'aviso' (el generico) en
 * vez de romper la lista entera.
 */
export const tipoAvisoSchema = z
  .enum(['novedad', 'mantenimiento', 'version', 'aviso'])
  .catch('aviso');

const aId = <T extends { _id: string }>({ _id, ...resto }: T) => ({ id: _id, ...resto });

/** Un aviso como lo ve la app: `GET /app/avisos`. */
export const avisoAppSchema = z
  .object({
    _id: z.string(),
    titulo: z.string(),
    mensaje: z.string(),
    tipo: tipoAvisoSchema,
    fecha: z.string(),
    /** Solo en los de tipo "version". */
    urlTienda: z.string().nullish(),
  })
  .transform(aId);

export const avisosAppSchema = z.object({
  datos: z.array(avisoAppSchema),
});

export const dispositivoRegistradoSchema = z.object({ registrado: z.boolean() });

/**
 * El `data` de cada notificacion. Solo interesan las de origen "aviso": si a
 * futuro hay otros origenes, esta version las ignora (no las abre).
 */
export const dataNotificacionSchema = z.object({
  origen: z.literal('aviso'),
  tipo: tipoAvisoSchema,
  avisoId: z.string().optional(),
  prueba: z.boolean().optional(),
  urlTienda: z.string().optional(),
});
