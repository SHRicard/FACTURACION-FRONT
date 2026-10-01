# Fix: los listados recargan todas las páginas de golpe

Afecta a **Facturación** (`listarFacturas`) y a **Clientes** (`listarClientes`).
El backend está bien; el cambio es solo en el front, en dos archivos.

## El problema

Cada vez que un listado se refresca, el front vuelve a pedir **todas las
páginas que ya había cargado, una atrás de otra**, en vez de pedir solo la
primera:

```
18:12:03.727  GET /facturas?porPagina=20          304
18:12:03.897  GET /facturas?pagina=2&porPagina=20 304
18:12:03.954  GET /facturas?pagina=3&porPagina=20 304
18:12:04.013  GET /facturas?pagina=4&porPagina=20 304
18:12:04.077  GET /facturas?pagina=5&porPagina=20 304
18:12:04.133  GET /facturas?pagina=6&porPagina=20 304

18:13:37.838  GET /clientes?porPagina=20          304
18:13:37.896  GET /clientes?pagina=2&porPagina=20 304
```

Con 107 facturas son 6 requests por refresco, y crece con cada página que el
usuario haya scrolleado. La lista vuelve a quedar gigante aunque nadie la haya
tocado.

## Lo que NO está mal

- **El backend pagina bien.** `GET /facturas?pagina=N&porPagina=20` devuelve 20
  ítems y `{ total, pagina, porPagina, paginas }`. Lo mismo `/clientes`.
- **El scroll infinito anda.** La primera carga pide de a una página, a medida
  que se scrollea (en el log, las páginas 3 a 6 llegan separadas por 1 a 10
  segundos).
- **El layout está bien.** `Pantalla` tiene `flex: 1` hasta el cuerpo, así que el
  `FlatList` tiene alto acotado y `onEndReached` no se dispara solo.

## La causa

Los dos listados son `build.infiniteQuery` de RTK Query. **Por defecto, cuando
un infinite query se vuelve a pedir, RTK Query re-pide en secuencia todas las
páginas que tiene en caché.** Eso pasa ante cualquiera de estos disparadores:

| Disparador | Dónde |
| --- | --- |
| Tirar para abajo en el listado | `refrescar` → `refetch()` en `useFacturas` / `useClientes` |
| Tirar para abajo en el Dashboard | `useRefrescarApi` invalida **todos** los tags. Las pestañas de Facturas y Clientes siguen montadas, así que sus listados también se recargan |
| Cargar o anular un ticket, registrar o anular un pago | Invalidan `{ type: 'Factura', id: 'LISTA' }` y los ids de las facturas |

## El fix

RTK Query 2.12 (la versión instalada) tiene la opción `refetchCachedPages`.
Según su propia documentación: _"When `false` only the first page will be
refetched."_ Con `false`, al recargar se pide solo la página 1, y la caché del
listado vuelve a quedar con esa página sola.

### 1. `src/features/facturas/api/facturasApi.ts`

```ts
listarFacturas: build.infiniteQuery<PaginaFacturas, FiltrosFacturas, number>({
  infiniteQueryOptions: {
    initialPageParam: 1,
    // `undefined` = no hay mas: es lo que apaga el `hasNextPage` del hook.
    getNextPageParam: (ultima) =>
      ultima.pagina < ultima.paginas ? ultima.pagina + 1 : undefined,
    // Al recargar (tirar para abajo, o un tag invalidado) se pide SOLO la
    // primera pagina. Sin esto RTK Query re-pide en fila todas las que el
    // usuario llego a scrollear: 6 requests en vez de 1.
    refetchCachedPages: false,
  },
  // ...lo demas queda igual
}),
```

Y corregir el comentario de arriba del endpoint, que hoy dice que `refetch`
"vuelve a pedir todas las cargadas". Ya no es así:

```ts
/**
 * Listado con scroll infinito.
 *
 * Es una `infiniteQuery`: RTK Query acumula las paginas en una sola entrada de
 * cache a medida que se scrollea. Al recargar vuelve a la primera pagina
 * (`refetchCachedPages: false`): una sola request, no una por pagina cargada.
 */
```

### 2. `src/features/clientes/api/clientesApi.ts`

El mismo agregado en `listarClientes`:

```ts
listarClientes: build.infiniteQuery<PaginaClientes, FiltrosClientes, number>({
  infiniteQueryOptions: {
    initialPageParam: 1,
    getNextPageParam: /* ...como esta... */,
    refetchCachedPages: false,
  },
  // ...
}),
```

**No hace falta tocar** los hooks (`useFacturas`, `useClientes`), las pantallas
ni `useRefrescarApi`. La opción va en el endpoint, así que alcanza a todos los
disparadores de la tabla.

### Regla para los próximos listados

Todo `build.infiniteQuery` nuevo lleva `refetchCachedPages: false`. Con buscar
`build.infiniteQuery` en `src/` tienen que aparecer tantos resultados como
`refetchCachedPages: false`.

## Qué cambia para el usuario

- Tirar para abajo deja la lista en las **primeras 20**, arriba de todo. Si
  sigue scrolleando, se cargan las siguientes como siempre.
- Después de registrar un pago o un ticket, al volver al listado se ve la
  página 1 actualizada, no las N páginas re-pedidas.

Es lo esperado en un scroll infinito: refrescar es "empezar de nuevo desde lo
más reciente".

## Cómo verificarlo

Con el backend corriendo, mirar su log (`.run.log` del backend):

1. Entrar a Facturación: tiene que salir **un** `GET /facturas?porPagina=20`.
2. Scrollear hasta el fondo: salen `pagina=2`, `pagina=3`… **de a una**, a medida
   que se baja.
3. Tirar para abajo: tiene que salir **un solo** `GET /facturas?porPagina=20`,
   no la ráfaga de 6.
4. Tirar para abajo en el Dashboard: **un** request por listado montado
   (`/facturas?porPagina=20` y `/clientes?porPagina=20`), no uno por página.
5. Lo mismo en Clientes.

## Checklist

- [x] `refetchCachedPages: false` en `listarFacturas`
- [x] `refetchCachedPages: false` en `listarClientes`
- [x] Comentario de `listarFacturas` actualizado (y el de `listarClientes`, que decía lo mismo)
- [x] `npx tsc --noEmit` sin errores
- [ ] Verificado en el log: un refresco = una request por listado
