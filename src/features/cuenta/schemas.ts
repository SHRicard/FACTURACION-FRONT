import { z } from 'zod';

/**
 * La palabra que el backend exige en el cuerpo del DELETE. Sin ella responde
 * 400: es para que un toque accidental no borre un negocio entero.
 *
 * El front la pide escrita (no la manda solo): borrar la cuenta es lo unico de
 * la app que no se puede deshacer y no tiene periodo de gracia.
 */
export const PALABRA_CONFIRMACION = 'ELIMINAR';

/**
 * DELETE /auth/me/cuenta. Los tres booleanos dicen que se borro DE VERDAD: si
 * la marca tenia otros duenos, el negocio queda para ellos y solo se va la
 * cuenta.
 */
export const cuentaEliminadaSchema = z.object({
  mensaje: z.string(),
  usuarioEliminado: z.boolean().default(false),
  marcaEliminada: z.boolean().default(false),
  datosDelNegocioEliminados: z.boolean().default(false),
});
