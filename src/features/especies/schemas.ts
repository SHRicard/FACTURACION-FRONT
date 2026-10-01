import { z } from 'zod';

/**
 * Mongo llama `_id` a la clave primaria. Se renombra aca, que es la unica capa
 * que deberia saber que del otro lado hay un Mongo.
 */
const aId = <T extends { _id: string }>({ _id, ...resto }: T) => ({ id: _id, ...resto });

/**
 * Una especie: el TIPO de mercaderia (Pantalon, Zapatilla, Media).
 *
 * `descripcion` y `cantidad` son opcionales de verdad: cuando no se cargaron, la
 * clave no viene en la respuesta (ni como null).
 *
 * `cantidad` es lo que le queda: el administrador la anota a mano y el backend
 * se la descuenta con cada ticket (y se la devuelve al corregirlo o anularlo),
 * sin bajar de 0. Nunca frena una venta. Ojo que `0` es un valor y no "sin
 * cantidad", asi que se pregunta con `!== undefined`, nunca por truthy.
 */
export const especieSchema = z
  .object({
    _id: z.string(),
    nombre: z.string(),
    descripcion: z.string().optional(),
    cantidad: z.number().optional(),
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
 * Lo que escribe la persona en el modal de alta y edicion. Son tres campos y
 * solo el nombre es obligatorio.
 *
 * `descripcion` no valida nada porque el vacio es valido: es la forma de
 * limpiarla en una edicion.
 *
 * `cantidad` se guarda como string (es lo que da un TextInput) y vacio quiere
 * decir "sin cantidad". Se convierte al armar el body, con `cantidadDelTexto`.
 */
export const especieFormSchema = z.object({
  nombre: z.string().trim().min(1, 'Poné el nombre.'),
  descripcion: z.string().trim(),
  cantidad: z.string().trim().regex(/^\d*$/, 'La cantidad va entera, de 0 para arriba.'),
});

/**
 * Del campo al body. Vacio es `null`: en el alta no se manda, y en la edicion
 * le saca la cantidad que tenia.
 */
export const cantidadDelTexto = (texto: string): number | null =>
  texto === '' ? null : Number(texto);
