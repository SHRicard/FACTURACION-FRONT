import { baseApi } from '@/services/api';

import { borradoEspecieSchema, especieSchema, listaEspeciesSchema } from '../schemas';
import type { CambiosEspecie, DatosEspecie, Especie } from '../types';

/**
 * La API ordena por bytes: "Zapatilla" antes que "abrigo", y los acentos al
 * final. Se reordena aca para que la lista se lea como una lista.
 */
const porNombre = (a: Especie, b: Especie) =>
  a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });

/**
 * Endpoints de especies. Son cuatro y no hay `GET /especies/:id`: la lista es
 * corta y viene entera, asi que el detalle sale de lo que ya esta en memoria.
 *
 * Reemplaza a `/catalogos`, que ya no existe.
 */
export const especiesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Todas las del negocio, activas e inactivas.
     *
     * No hay filtro por `activo` en el backend: el que necesite solo las activas
     * (el selector del ticket) filtra en el front.
     */
    listarEspecies: build.query<Especie[], void>({
      query: () => ({ url: '/especies' }),
      transformResponse: (respuesta: unknown) =>
        listaEspeciesSchema.parse(respuesta).sort(porNombre),
      providesTags: (resultado) => [
        { type: 'Especie' as const, id: 'LISTA' },
        ...(resultado ?? []).map((especie) => ({ type: 'Especie' as const, id: especie.id })),
      ],
    }),

    /** Nace siempre activa: mandar `activo` en el alta no tiene efecto. */
    crearEspecie: build.mutation<Especie, DatosEspecie>({
      query: (datos) => ({ url: '/especies', method: 'POST', body: datos }),
      transformResponse: (respuesta: unknown) => especieSchema.parse(respuesta),
      invalidatesTags: [{ type: 'Especie', id: 'LISTA' }],
    }),

    /**
     * Edicion PARCIAL: lo que no se manda queda como esta, no se borra. Es
     * tambien el endpoint del interruptor de activa.
     *
     * Renombrar NO reescribe los tickets viejos: cada item guardo el nombre que
     * la especie tenia ese dia. Las metricas agrupan por id, asi que el
     * renombre si se refleja ahi.
     */
    editarEspecie: build.mutation<Especie, { id: string; cambios: CambiosEspecie }>({
      query: ({ id, cambios }) => ({
        url: `/especies/${encodeURIComponent(id)}`,
        method: 'PUT',
        body: cambios,
      }),
      transformResponse: (respuesta: unknown) => especieSchema.parse(respuesta),
      invalidatesTags: (_resultado, _error, { id }) => [
        { type: 'Especie', id },
        { type: 'Especie', id: 'LISTA' },
      ],
    }),

    /**
     * Borrado REAL, y solo si no la nombra ningun ticket ni ningun producto de
     * la lista de precios.
     *
     * Si esta en uso responde 400 con el mensaje ya redactado y los dos conteos
     * en `detalles`. Eso no es un error para mostrar y olvidar: es la pregunta
     * "¿la desactivo?". Ver `useEspecies`.
     */
    eliminarEspecie: build.mutation<{ mensaje: string }, string>({
      query: (id) => ({ url: `/especies/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: (respuesta: unknown) => borradoEspecieSchema.parse(respuesta),
      invalidatesTags: [{ type: 'Especie', id: 'LISTA' }],
    }),
  }),
});

export const {
  useListarEspeciesQuery,
  useCrearEspecieMutation,
  useEditarEspecieMutation,
  useEliminarEspecieMutation,
} = especiesApi;
