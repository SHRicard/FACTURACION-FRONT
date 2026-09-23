import { z } from 'zod';

/**
 * Schemas de la versión mínima de la app (K8).
 *
 * Los dos son tolerantes a propósito: lo único que importa es saber si esta
 * versión quedó por debajo de la mínima. Un dato que falta o viene raro no
 * puede terminar en un error que tape la app; como mucho, se pierde el link.
 */

/**
 * GET /app/version. Es público y se pide al arrancar, sin bloquear.
 *
 * `ultima` es la más nueva publicada: si esta versión es menor, se avisa sin
 * bloquear. `urlTienda` es a dónde manda el botón "Actualizar".
 */
export const versionAppSchema = z.object({
  minima: z.string(),
  ultima: z.string().nullable().catch(null),
  urlTienda: z.url().nullable().catch(null),
});

/**
 * El cuerpo del 426 APP_DESACTUALIZADA, en la forma de errores de K11. Todo es
 * opcional: aunque no traiga datos, igual se bloquea.
 */
export const cuerpoDesactualizadaSchema = z.object({
  detalles: z
    .object({
      minima: z.string().optional(),
      urlTienda: z.url().optional().catch(undefined),
    })
    .optional(),
});
