import { z } from 'zod';

/**
 * Mongo llama `_id` a la clave primaria. Se renombra aca, que es la unica capa
 * que deberia saber que del otro lado hay un Mongo.
 */
const aId = <T extends { _id: string }>({ _id, ...resto }: T) => ({ id: _id, ...resto });

/**
 * Una especie: el TIPO de mercaderia (Pantalon, Zapatilla, Media).
 *
 * `descripcion` es opcional de verdad: cuando no se cargo, la clave no viene en
 * la respuesta.
 */
export const especieSchema = z
  .object({
    _id: z.string(),
    nombre: z.string(),
    descripcion: z.string().optional(),
    activo: z.boolean(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .transform(aId);

/** El listado viene como array plano, no como objeto paginado. */
export const listaEspeciesSchema = z.array(especieSchema);

/** Lo que responde el DELETE cuando pudo borrar. */
export const borradoEspecieSchema = z.object({ mensaje: z.string() });

/**
 * Lo que escribe la persona en el modal de alta y edicion. Son dos campos.
 *
 * `descripcion` no valida nada porque el vacio es valido: es la forma de
 * limpiarla en una edicion.
 */
export const especieFormSchema = z.object({
  nombre: z.string().trim().min(1, 'Poné el nombre.'),
  descripcion: z.string().trim(),
});
