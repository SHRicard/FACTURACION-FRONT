import { baseApi } from '@/services/api';

import {
  crecimientoSchema,
  detalleErrorSchema,
  detalleMarcaSchema,
  detalleUsuarioSchema,
  errorResueltoSchema,
  estadoSistemaSchema,
  listadoErroresSchema,
  marcaConDuenosSchema,
  mensajeSchema,
  paginaMarcasSchema,
  paginaUsuariosSchema,
  recalculoTodasSchema,
  resumenPlataformaSchema,
  usuarioEliminadoSchema,
  usuarioEnListadoSchema,
} from '../schemas';
import type {
  Crecimiento,
  DatosCrearUsuario,
  DatosEditarMarca,
  DatosEditarUsuario,
  DetalleError,
  DetalleMarca,
  DetalleUsuario,
  ErrorResuelto,
  EstadoSistema,
  FiltrosCrecimiento,
  FiltrosErrores,
  FiltrosMarcas,
  FiltrosUsuarios,
  ListadoErrores,
  MarcaConDuenos,
  Mensaje,
  PaginaMarcas,
  PaginaUsuarios,
  RecalculoTodas,
  ResumenPlataforma,
  UsuarioEliminado,
  UsuarioEnListado,
} from '../types';

/** Cuantas filas trae cada pagina. El backend acepta hasta 100. */
const POR_PAGINA = 20;

/**
 * Arma `?a=1&b=2` mandando SOLO lo que tiene valor.
 *
 * Sin este filtro la URL se llena de `buscar=&fatal=`, que ademas parte la
 * cache de RTK Query en entradas distintas para pedidos equivalentes.
 */
function armarQuery(filtros: object, pagina?: number): string {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === null) continue;
    const texto = typeof valor === 'string' ? valor.trim() : String(valor);
    if (texto !== '') params.set(clave, texto);
  }
  if (pagina !== undefined) {
    if (pagina > 1) params.set('pagina', String(pagina));
    params.set('porPagina', String(POR_PAGINA));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Siguiente pagina de un paginado, o `undefined` si no hay mas. */
const siguientePagina = (ultima: { pagina: number; paginas: number }) =>
  ultima.pagina < ultima.paginas ? ultima.pagina + 1 : undefined;

const id = (valor: string) => encodeURIComponent(valor);

/**
 * El panel del super_admin: todo lo de `/admin/*` (docs/SUPER_ADMIN.md).
 *
 * Los tags:
 *   'Plataforma'   → resumen, crecimiento y sistema: los numeros de todo.
 *   'AdminUsuario' → las cuentas, por id y la LISTA.
 *   'AdminMarca'   → las marcas, por id y la LISTA.
 *   'ErrorApp'     → los grupos de errores, por huella y la LISTA.
 *
 * Tocar una cuenta o una marca cambia los numeros del tablero, asi que casi
 * toda mutacion invalida tambien 'Plataforma'.
 */
export const superAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ─────────────────────────── Tablero ───────────────────────────

    resumenPlataforma: build.query<ResumenPlataforma, void>({
      query: () => ({ url: '/admin/resumen' }),
      transformResponse: (respuesta: unknown) => resumenPlataformaSchema.parse(respuesta),
      providesTags: [{ type: 'Plataforma', id: 'RESUMEN' }],
    }),

    crecimiento: build.query<Crecimiento, FiltrosCrecimiento>({
      query: (filtros) => ({ url: `/admin/crecimiento${armarQuery(filtros)}` }),
      transformResponse: (respuesta: unknown) => crecimientoSchema.parse(respuesta),
      providesTags: [{ type: 'Plataforma', id: 'CRECIMIENTO' }],
    }),

    estadoSistema: build.query<EstadoSistema, void>({
      query: () => ({ url: '/admin/sistema' }),
      transformResponse: (respuesta: unknown) => estadoSistemaSchema.parse(respuesta),
      providesTags: [{ type: 'Plataforma', id: 'SISTEMA' }],
    }),

    // ─────────────────────────── Usuarios ───────────────────────────

    listarUsuariosAdmin: build.infiniteQuery<PaginaUsuarios, FiltrosUsuarios, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: siguientePagina,
        // Al invalidar se re-piden las paginas scrolleadas: la fila que cambio
        // (una suspension) se actualiza sin que la lista se achique.
        refetchCachedPages: true,
      },
      query: ({ queryArg, pageParam }) => ({
        url: `/admin/usuarios${armarQuery(queryArg, pageParam)}`,
      }),
      transformResponse: (respuesta: unknown) => paginaUsuariosSchema.parse(respuesta),
      providesTags: (resultado) => [
        { type: 'AdminUsuario' as const, id: 'LISTA' },
        ...(resultado?.pages ?? []).flatMap((pagina) =>
          pagina.datos.map((usuario) => ({ type: 'AdminUsuario' as const, id: usuario.id })),
        ),
      ],
    }),

    detalleUsuarioAdmin: build.query<DetalleUsuario, string>({
      query: (usuarioId) => ({ url: `/admin/usuarios/${id(usuarioId)}` }),
      transformResponse: (respuesta: unknown) => detalleUsuarioSchema.parse(respuesta),
      providesTags: (_resultado, _error, usuarioId) => [{ type: 'AdminUsuario', id: usuarioId }],
    }),

    crearUsuarioAdmin: build.mutation<UsuarioEnListado, DatosCrearUsuario>({
      query: (datos) => ({ url: '/admin/usuarios', method: 'POST', body: datos }),
      transformResponse: (respuesta: unknown) => usuarioEnListadoSchema.parse(respuesta),
      invalidatesTags: [{ type: 'AdminUsuario', id: 'LISTA' }, 'Plataforma'],
    }),

    /**
     * Correccion de nombre, email o DNI. Sacar el DNI devuelve a la persona a
     * "completá tu perfil". Si tiene marca, cambia lo que se ve de ella como
     * dueno: por eso tambien 'AdminMarca'.
     */
    editarUsuarioAdmin: build.mutation<DetalleUsuario, { id: string; cambios: DatosEditarUsuario }>(
      {
        query: ({ id: usuarioId, cambios }) => ({
          url: `/admin/usuarios/${id(usuarioId)}`,
          method: 'PUT',
          body: cambios,
        }),
        transformResponse: (respuesta: unknown) => detalleUsuarioSchema.parse(respuesta),
        invalidatesTags: (_resultado, _error, { id: usuarioId }) => [
          { type: 'AdminUsuario', id: usuarioId },
          { type: 'AdminUsuario', id: 'LISTA' },
          'AdminMarca',
          'Plataforma',
        ],
      },
    ),

    suspenderUsuario: build.mutation<DetalleUsuario, { id: string; motivo?: string }>({
      query: ({ id: usuarioId, motivo }) => ({
        url: `/admin/usuarios/${id(usuarioId)}/suspender`,
        method: 'POST',
        body: motivo ? { motivo } : {},
      }),
      transformResponse: (respuesta: unknown) => detalleUsuarioSchema.parse(respuesta),
      invalidatesTags: (_resultado, _error, { id: usuarioId }) => [
        { type: 'AdminUsuario', id: usuarioId },
        { type: 'AdminUsuario', id: 'LISTA' },
        'AdminMarca',
        'Plataforma',
      ],
    }),

    reactivarUsuario: build.mutation<DetalleUsuario, string>({
      query: (usuarioId) => ({ url: `/admin/usuarios/${id(usuarioId)}/reactivar`, method: 'POST' }),
      transformResponse: (respuesta: unknown) => detalleUsuarioSchema.parse(respuesta),
      invalidatesTags: (_resultado, _error, usuarioId) => [
        { type: 'AdminUsuario', id: usuarioId },
        { type: 'AdminUsuario', id: 'LISTA' },
        'AdminMarca',
        'Plataforma',
      ],
    }),

    /** No cambia nada que se vea: no invalida. */
    cerrarSesionesUsuario: build.mutation<Mensaje, string>({
      query: (usuarioId) => ({
        url: `/admin/usuarios/${id(usuarioId)}/cerrar-sesiones`,
        method: 'POST',
      }),
      transformResponse: (respuesta: unknown) => mensajeSchema.parse(respuesta),
    }),

    /**
     * Baja irreversible. Sin `eliminarMarca`, al unico dueno de una marca el
     * backend lo frena con 409 UNICO_DUENO: el hook muestra que se perderia y
     * reenvia con `eliminarMarca: true` si se confirma.
     *
     * No invalida el tag del usuario borrado a proposito: la ficha montada lo
     * re-pediria y mostraria un 404 mientras se vuelve a la lista.
     */
    eliminarUsuarioAdmin: build.mutation<UsuarioEliminado, { id: string; eliminarMarca: boolean }>({
      query: ({ id: usuarioId, eliminarMarca }) => ({
        url: `/admin/usuarios/${id(usuarioId)}`,
        method: 'DELETE',
        body: eliminarMarca
          ? { confirmar: 'ELIMINAR', eliminarMarca: true }
          : { confirmar: 'ELIMINAR' },
      }),
      transformResponse: (respuesta: unknown) => usuarioEliminadoSchema.parse(respuesta),
      invalidatesTags: [{ type: 'AdminUsuario', id: 'LISTA' }, 'AdminMarca', 'Plataforma'],
    }),

    // ─────────────────────────── Marcas ───────────────────────────

    listarMarcasAdmin: build.infiniteQuery<PaginaMarcas, FiltrosMarcas, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: siguientePagina,
        refetchCachedPages: true,
      },
      query: ({ queryArg, pageParam }) => ({
        url: `/admin/marcas${armarQuery(queryArg, pageParam)}`,
      }),
      transformResponse: (respuesta: unknown) => paginaMarcasSchema.parse(respuesta),
      providesTags: (resultado) => [
        { type: 'AdminMarca' as const, id: 'LISTA' },
        ...(resultado?.pages ?? []).flatMap((pagina) =>
          pagina.datos.map((marca) => ({ type: 'AdminMarca' as const, id: marca.id })),
        ),
      ],
    }),

    detalleMarcaAdmin: build.query<DetalleMarca, string>({
      query: (marcaId) => ({ url: `/admin/marcas/${id(marcaId)}` }),
      transformResponse: (respuesta: unknown) => detalleMarcaSchema.parse(respuesta),
      providesTags: (_resultado, _error, marcaId) => [{ type: 'AdminMarca', id: marcaId }],
    }),

    editarMarcaAdmin: build.mutation<DetalleMarca, { id: string; datos: DatosEditarMarca }>({
      query: ({ id: marcaId, datos }) => ({
        url: `/admin/marcas/${id(marcaId)}`,
        method: 'PUT',
        body: datos,
      }),
      transformResponse: (respuesta: unknown) => detalleMarcaSchema.parse(respuesta),
      invalidatesTags: (_resultado, _error, { id: marcaId }) => [
        { type: 'AdminMarca', id: marcaId },
        { type: 'AdminMarca', id: 'LISTA' },
        'AdminUsuario',
        'Plataforma',
      ],
    }),

    /** Sumar o sacar un dueno cambia tambien la ficha de esa cuenta. */
    sumarDuenoAdmin: build.mutation<DetalleMarca, { id: string; dni: string }>({
      query: ({ id: marcaId, dni }) => ({
        url: `/admin/marcas/${id(marcaId)}/duenos`,
        method: 'POST',
        body: { dni },
      }),
      transformResponse: (respuesta: unknown) => detalleMarcaSchema.parse(respuesta),
      invalidatesTags: (_resultado, _error, { id: marcaId }) => [
        { type: 'AdminMarca', id: marcaId },
        { type: 'AdminMarca', id: 'LISTA' },
        'AdminUsuario',
        'Plataforma',
      ],
    }),

    sacarDuenoAdmin: build.mutation<DetalleMarca, { id: string; usuarioId: string }>({
      query: ({ id: marcaId, usuarioId }) => ({
        url: `/admin/marcas/${id(marcaId)}/duenos/${id(usuarioId)}`,
        method: 'DELETE',
      }),
      transformResponse: (respuesta: unknown) => detalleMarcaSchema.parse(respuesta),
      invalidatesTags: (_resultado, _error, { id: marcaId }) => [
        { type: 'AdminMarca', id: marcaId },
        { type: 'AdminMarca', id: 'LISTA' },
        'AdminUsuario',
        'Plataforma',
      ],
    }),

    /** Soporte: rehace las estadisticas de una marca si algun numero no cierra. */
    recalcularMarca: build.mutation<MarcaConDuenos, string>({
      query: (marcaId) => ({ url: `/admin/marcas/${id(marcaId)}/recalcular`, method: 'POST' }),
      transformResponse: (respuesta: unknown) => marcaConDuenosSchema.parse(respuesta),
      invalidatesTags: (_resultado, _error, marcaId) => [
        { type: 'AdminMarca', id: marcaId },
        { type: 'AdminMarca', id: 'LISTA' },
        'Plataforma',
      ],
    }),

    /** Todas las marcas. Puede tardar unos segundos. */
    recalcularTodasLasMarcas: build.mutation<RecalculoTodas, void>({
      query: () => ({ url: '/admin/marcas/recalcular', method: 'POST' }),
      transformResponse: (respuesta: unknown) => recalculoTodasSchema.parse(respuesta),
      invalidatesTags: ['AdminMarca', 'AdminUsuario', 'Plataforma'],
    }),

    // ─────────────────────────── Errores de la app ───────────────────────────

    listarErroresApp: build.infiniteQuery<ListadoErrores, FiltrosErrores, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: siguientePagina,
        refetchCachedPages: true,
      },
      query: ({ queryArg, pageParam }) => ({
        url: `/admin/errores${armarQuery(queryArg, pageParam)}`,
      }),
      transformResponse: (respuesta: unknown) => listadoErroresSchema.parse(respuesta),
      providesTags: (resultado) => [
        { type: 'ErrorApp' as const, id: 'LISTA' },
        ...(resultado?.pages ?? []).flatMap((pagina) =>
          pagina.datos.map((grupo) => ({ type: 'ErrorApp' as const, id: grupo.huella })),
        ),
      ],
    }),

    detalleErrorApp: build.infiniteQuery<
      DetalleError,
      { huella: string; filtros: FiltrosErrores },
      number
    >({
      infiniteQueryOptions: {
        initialPageParam: 1,
        // La paginacion de las ocurrencias viene adentro, no en la raiz.
        getNextPageParam: ({ ocurrencias }) => siguientePagina(ocurrencias),
        refetchCachedPages: false,
      },
      query: ({ queryArg, pageParam }) => ({
        url: `/admin/errores/${id(queryArg.huella)}${armarQuery(queryArg.filtros, pageParam)}`,
      }),
      transformResponse: (respuesta: unknown) => detalleErrorSchema.parse(respuesta),
      providesTags: (_resultado, _error, { huella }) => [{ type: 'ErrorApp' as const, id: huella }],
    }),

    /**
     * "Ya lo arregle": borra todos los reportes del grupo. Como la ficha, no
     * invalida su propia huella (volveria como 404 mientras se sale).
     */
    resolverErrorApp: build.mutation<ErrorResuelto, string>({
      query: (huella) => ({ url: `/admin/errores/${id(huella)}`, method: 'DELETE' }),
      transformResponse: (respuesta: unknown) => errorResueltoSchema.parse(respuesta),
      invalidatesTags: [{ type: 'ErrorApp', id: 'LISTA' }, 'Plataforma'],
    }),
  }),
});

export const {
  useResumenPlataformaQuery,
  useCrecimientoQuery,
  useEstadoSistemaQuery,
  useListarUsuariosAdminInfiniteQuery,
  useDetalleUsuarioAdminQuery,
  useCrearUsuarioAdminMutation,
  useEditarUsuarioAdminMutation,
  useSuspenderUsuarioMutation,
  useReactivarUsuarioMutation,
  useCerrarSesionesUsuarioMutation,
  useEliminarUsuarioAdminMutation,
  useListarMarcasAdminInfiniteQuery,
  useDetalleMarcaAdminQuery,
  useEditarMarcaAdminMutation,
  useSumarDuenoAdminMutation,
  useSacarDuenoAdminMutation,
  useRecalcularMarcaMutation,
  useRecalcularTodasLasMarcasMutation,
  useListarErroresAppInfiniteQuery,
  useDetalleErrorAppInfiniteQuery,
  useResolverErrorAppMutation,
} = superAdminApi;
