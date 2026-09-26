# Panel del super_admin

El **super_admin** es el dueño de la app. No opera un negocio (no tiene marca
ni carga tickets): **mira la plataforma entera y da soporte**. Todo lo que
necesita vive bajo **`/admin`**.

- **Base:** `http://localhost:4000`
- **Auth:** `Authorization: Bearer <token>` de una cuenta con `rol: "super_admin"`
- **Errores:** siempre `{ error, codigo?, detalles? }` (igual que el resto de la API)
- **Montos:** números en pesos, redondeados a 2 decimales
- **Fechas:** ISO 8601 en UTC (`"2026-09-23T21:00:13.725Z"`). Los tramos de
  las series (`"2026-09-23"`, `"2026-09"`) ya vienen en hora de Argentina.

---

## Índice

1. [Cómo entra el super_admin](#1-cómo-entra-el-super_admin)
2. [Las pantallas sugeridas](#2-las-pantallas-sugeridas)
3. [Tablero: `GET /admin/resumen`](#3-tablero-get-adminresumen)
4. [Crecimiento: `GET /admin/crecimiento`](#4-crecimiento-get-admincrecimiento)
5. [Usuarios](#5-usuarios)
6. [Marcas](#6-marcas)
7. [Errores de la app](#7-errores-de-la-app)
8. [Sistema: `GET /admin/sistema`](#8-sistema-get-adminsistema)
9. [Cambios que afectan a la app del administrador](#9-cambios-que-afectan-a-la-app-del-administrador)
10. [Tipos TypeScript](#10-tipos-typescript)
11. [Cliente de API sugerido](#11-cliente-de-api-sugerido)
12. [Tabla de todos los endpoints](#12-tabla-de-todos-los-endpoints)

---

## 1. Cómo entra el super_admin

Entra por el **mismo login** que cualquiera (`POST /auth/login`). La cuenta
se crea sola al arrancar el server con `SUPER_ADMIN_EMAIL` y
`SUPER_ADMIN_PASSWORD` del `.env`.

```jsonc
// POST /auth/login → 200
{
  "token": "eyJhbGciOi...",
  "usuario": { "_id": "...", "nombre": "Super Admin", "email": "...", "rol": "super_admin" },
  "pendiente": null          // el super_admin nunca tiene onboarding
}
```

**Regla del front:** después del login (o de `GET /auth/me` al recargar),
mirar `usuario.rol`:

| `rol` | A dónde va |
| --- | --- |
| `"super_admin"` | Al **panel de `/admin`** (lo de este documento) |
| `"administrador"` | A la app de siempre (con su `pendiente` de onboarding) |

> El super_admin **no puede** usar las rutas del negocio (`/clientes`,
> `/facturas`, `/marcas/mia`…): responden `403`. Y un administrador que llame
> a `/admin/*` recibe `403 { "error": "Solo el super_admin puede hacer esto" }`.

`GET /auth/me` para el super_admin devuelve `marca: null` y `pendiente: null`.

---

## 2. Las pantallas sugeridas

```
┌──────────── Panel super_admin ────────────┐
│  Tablero        → /admin/resumen           │
│                   /admin/crecimiento       │
│  Usuarios       → /admin/usuarios          │
│    └ Detalle    → /admin/usuarios/:id      │
│  Marcas         → /admin/marcas            │
│    └ Detalle    → /admin/marcas/:id        │
│  Errores app    → /admin/errores           │
│    └ Detalle    → /admin/errores/:huella   │
│  Sistema        → /admin/sistema           │
└────────────────────────────────────────────┘
```

| Pantalla | Qué muestra | Acciones |
| --- | --- | --- |
| **Tablero** | Tarjetas con los números (usuarios, marcas, plata, errores) + gráfico de crecimiento + últimos registros | Cambiar el rango del gráfico (día/mes) |
| **Usuarios** | Tabla paginada con buscador y filtros | Crear cuenta |
| **Detalle de usuario** | Datos, marca, actividad, onboarding | Editar, suspender/reactivar, cerrar sesiones, eliminar |
| **Marcas** | Tabla paginada con orden por plata / actividad | Recalcular todas |
| **Detalle de marca** | Datos, dueños, estadísticas, uso | Editar, sumar/sacar dueño, recalcular |
| **Errores** | Errores de la app agrupados | Ver detalle, marcar resuelto |
| **Sistema** | Server, base, servicios, versiones de la app en uso | — (solo lectura, refrescar) |

---

## 3. Tablero: `GET /admin/resumen`

Todo el tablero en **una sola respuesta**. Sin parámetros.

```jsonc
// GET /admin/resumen → 200
{
  "generadoEl": "2026-09-23T21:00:13.725Z",
  "usuarios": {
    "administradores": 3,          // cuentas de dueños de negocio
    "superAdmins": 1,
    "porProveedor": { "local": 3, "google": 0 },
    "nuevos":  { "hoy": 3, "ultimos7d": 3, "ultimos30d": 3 },
    "activos": { "ultimos7d": 2, "ultimos30d": 2 },   // usaron la app en ese lapso
    "suspendidos": 0,
    "pendientes": {                // se quedaron a mitad del onboarding
      "terminos": 0,               //   no aceptaron los términos vigentes
      "perfil": 1,                 //   no cargaron el DNI
      "marca": 0                   //   tienen DNI pero no marca
    }
  },
  "marcas": {
    "total": 1,
    "nuevas30d": 1,
    "activas30d": 1,               // cargaron un ticket o un pago en 30 días
    "inactivas30d": 0,
    "conLogo": 0
  },
  "negocio": {
    "clientes": 1,                 // clientes de todas las marcas
    "facturasConDeuda": 1,
    "facturasVencidas": 0,         // con deuda y ya vencidas
    "historico": {                 // suma de todas las marcas, desde siempre
      "vendido": 50000,
      "cobrado": 15000,
      "deudaPendiente": 35000
    },
    "ultimos30d": {                // lo cargado en los últimos 30 días
      "tickets": 1,
      "pagos": 1,
      "vendido": 50000,
      "cobrado": 15000             // lo que dejaron al comprar + pagos a cuenta
    }
  },
  "errores": {                     // errores que reportó la app
    "ultimas24h": 2,
    "ultimos7d": 2,
    "fatales7d": 1,
    "distintos7d": 1               // cuántos errores DISTINTOS (grupos)
  },
  "recientes": {
    "usuarios": [                  // los 5 últimos registrados
      { "_id": "...", "nombre": "Caro", "email": "caro@test.com", "proveedor": "local",
        "createdAt": "...", "marca": { "_id": "...", "nombre": "BebyRo" } }   // marca solo si tiene
    ],
    "marcas": [                    // las 5 últimas creadas
      { "_id": "...", "nombre": "BebyRo", "logoUrl": "...", "createdAt": "...",
        "estadisticas": { "cantidadClientes": 1, "totalVendido": 50000, "totalCobrado": 15000, "deudaPendiente": 35000 } }
    ]
  }
}
```

**Tarjetas sugeridas:**

| Tarjeta | Valor | Subtexto |
| --- | --- | --- |
| Usuarios | `usuarios.administradores` | `+{nuevos.ultimos7d}` esta semana · `{activos.ultimos7d}` activos |
| Marcas | `marcas.total` | `{activas30d}` activas · `{inactivas30d}` dormidas |
| Vendido (30 días) | `negocio.ultimos30d.vendido` | `{ultimos30d.tickets}` tickets |
| Deuda en la calle | `negocio.historico.deudaPendiente` | `{facturasVencidas}` facturas vencidas |
| Errores (24 h) | `errores.ultimas24h` | `{fatales7d}` fatales en la semana — en rojo si `> 0` |
| Onboarding trabado | `pendientes.perfil + pendientes.marca` | "se registraron y no arrancaron" |

> "Activo" sale del **último acceso** de cada cuenta (ver
> [sección 9](#9-cambios-que-afectan-a-la-app-del-administrador)). Las
> cuentas que no entraron desde que se desplegó este cambio figuran como
> nunca activas hasta su próximo uso.

---

## 4. Crecimiento: `GET /admin/crecimiento`

La serie para el gráfico del tablero. **Los tramos sin movimiento vienen en 0**:
no hay huecos que rellenar en el front.

| Query | Valores | Default |
| --- | --- | --- |
| `agrupar` | `dia` \| `mes` | `dia` |
| `dias` | 1 a 180 (solo con `agrupar=dia`) | 30 |
| `meses` | 1 a 36 (solo con `agrupar=mes`) | 12 |

```jsonc
// GET /admin/crecimiento?agrupar=dia&dias=3 → 200
{
  "agrupar": "dia",
  "desde": "2026-09-21",
  "hasta": "2026-09-23",
  "serie": [
    { "periodo": "2026-09-21", "usuarios": 0, "marcas": 0, "tickets": 0, "pagos": 0, "vendido": 0, "cobrado": 0 },
    { "periodo": "2026-09-22", "usuarios": 0, "marcas": 0, "tickets": 0, "pagos": 0, "vendido": 0, "cobrado": 0 },
    { "periodo": "2026-09-23", "usuarios": 3, "marcas": 1, "tickets": 1, "pagos": 1, "vendido": 50000, "cobrado": 15000 }
  ],
  "totales": { "usuarios": 3, "marcas": 1, "tickets": 1, "pagos": 1, "vendido": 50000, "cobrado": 15000 }
}

// GET /admin/crecimiento?agrupar=mes&meses=12 → "periodo": "2026-09"
```

| Campo de cada tramo | Qué cuenta |
| --- | --- |
| `usuarios` | Cuentas de administrador creadas |
| `marcas` | Marcas creadas |
| `tickets` / `pagos` | Cargados en la app (sin los anulados) |
| `vendido` | Σ total de esos tickets |
| `cobrado` | Lo que dejaron en esos tickets + esos pagos |

> Se cuenta por **fecha de carga** (cuándo se usó la app), no por la fecha que
> el kiosquero le puso al ticket. Mide el uso de la plataforma.

**Gráficos sugeridos:** barras de `usuarios` y `marcas` (altas); línea de
`tickets` + `pagos` (uso); área de `vendido` y `cobrado` (plata). Un selector
"30 días / 90 días / 12 meses".

Query inválida → `400` con `detalles.campo` (ej. `dias=999`).

---

## 5. Usuarios

### 5.1 Listar: `GET /admin/usuarios`

Paginado, con la misma forma que el resto de la API:
`{ datos, total, pagina, porPagina, paginas }`.

| Query | Valores | Para qué |
| --- | --- | --- |
| `buscar` | texto | Por nombre (sin importar tildes), email o DNI (por el comienzo: `3011` encuentra `30111222`) |
| `rol` | `super_admin` \| `administrador` | |
| `proveedor` | `local` \| `google` | Cómo creó la cuenta |
| `onboarding` | `terminos` \| `perfil` \| `marca` \| `listo` | En qué paso está (solo administradores) |
| `suspendida` | `true` \| `false` | |
| `activosDias` | 1 a 3650 | Entraron en los últimos N días |
| `inactivosDias` | 1 a 3650 | No entran hace N días (o nunca entraron) |
| `orden` | `recientes` (default) \| `antiguos` \| `nombre` \| `ultimoAcceso` | |
| `pagina`, `porPagina` | porPagina máx. 100, default 20 | |

```jsonc
// GET /admin/usuarios?onboarding=perfil → 200
{
  "datos": [
    {
      "_id": "6ab43ddd6298c2e134b9b457",
      "nombre": "Caro",
      "email": "caro@test.com",
      "rol": "administrador",
      "proveedor": "local",
      "dni": "30111444",                   // no viene si no lo cargó
      "marca": { "_id": "...", "nombre": "BebyRo", "logoUrl": "..." },   // o no viene si no tiene
      "avatar": "https://...",             // solo cuentas de Google
      "aceptoTerminosYCondiciones": true,
      "terminosYCondicionesVersion": "2026-09-17",
      "ultimoAcceso": "2026-09-23T21:00:13.588Z",   // puede no venir: nunca entró
      "ultimaVersionApp": "1.2.0",                  // puede no venir
      "suspendida": false,
      "suspendidaEl": "...",               // solo si está suspendida
      "motivoSuspension": "...",           // solo si se dio un motivo
      "createdAt": "...",
      "updatedAt": "...",
      "pendiente": "perfil"                // "terminos" | "perfil" | "marca" | null
    }
  ],
  "total": 1, "pagina": 1, "porPagina": 20, "paginas": 1
}
```

**Columnas sugeridas:** avatar + nombre · email · marca · estado (chip) ·
último acceso ("hace 3 días") · alta.

**Chip de estado**, en este orden de prioridad:

| Condición | Chip |
| --- | --- |
| `suspendida` | 🔴 Suspendida |
| `rol === "super_admin"` | ⭐ Super admin |
| `pendiente === "terminos"` | 🟡 Sin aceptar términos |
| `pendiente === "perfil"` | 🟡 Sin DNI |
| `pendiente === "marca"` | 🟡 Sin marca |
| `pendiente === null` | 🟢 Activo |

**Filtros rápidos sugeridos** (tabs): Todos · Trabados en onboarding
(`onboarding=perfil` o `marca`) · Inactivos (`inactivosDias=30`) · Suspendidos
(`suspendida=true`).

### 5.2 Detalle: `GET /admin/usuarios/:id`

```jsonc
// GET /admin/usuarios/6ab4... → 200
{
  "usuario": { /* igual que en el listado, sin `pendiente` y con `marca` como id */ },
  "pendiente": null,
  "marca": {                          // null si no tiene marca
    "_id": "...", "nombre": "BebyRo", "logoUrl": "...", "direccion": "...", "telefono": "...",
    "colorPrimario": "#4a1866", "colorSecundario": null,
    "estadisticas": { "cantidadClientes": 1, "totalVendido": 50000, "totalCobrado": 15000, "deudaPendiente": 35000, "actualizadasEl": "..." },
    "duenos": [ { "_id": "...", "nombre": "Ana", "email": "...", "dni": "30111222", "avatar": "..." } ],
    "puedeSubirLogo": true
  },
  "actividad": {
    "ultimoAcceso": "2026-09-23T21:00:13.588Z",   // o null
    "ultimaVersionApp": "1.2.0",                  // o null
    "ticketsRegistrados": 1,        // cargados por ESTA persona (no toda la marca)
    "pagosRegistrados": 0,
    "ultimoTicketEl": "...",        // o null
    "ultimoPagoEl": null,
    "erroresApp30d": 1              // errores de la app que le pasaron a esta persona
  }
}
```

Id que no existe o mal formado → `404 { "error": "Usuario no encontrado" }`.

### 5.3 Crear: `POST /admin/usuarios`

```jsonc
// Body
{
  "nombre": "Dani",                 // requerido, hasta 100
  "email": "dani@test.com",         // requerido, único
  "password": "secreto123",         // requerido, mínimo 6
  "rol": "administrador",           // opcional: "administrador" (default) | "super_admin"
  "dni": "30.111.555"               // opcional, 7-8 números, único
}
// → 201: el usuario (misma forma que un renglón del listado, con `pendiente`)
```

La cuenta nace **sin términos aceptados**: la persona los acepta al entrar
por primera vez (`pendiente: "terminos"`), como cualquier otra.

| Error | Cuándo |
| --- | --- |
| `400` + `detalles.campos.<campo>` | Falta un campo o tiene mal formato |
| `409` + `detalles.campos.email` | Ese email ya tiene cuenta |
| `409` + `detalles.campos.dni` | Ese DNI ya tiene cuenta |

### 5.4 Editar: `PUT /admin/usuarios/:id`

Solo cambia lo que viene. Para **corregir datos** que el usuario no puede
tocar solo (el DNI se carga una sola vez).

```jsonc
{ "nombre": "Carolina", "email": "caro@nuevo.com", "dni": "30.111.444" }
// "dni": null → le saca el DNI y vuelve a "completá tu perfil"
//               (no se puede si ya está en una marca: 400)
// → 200: el mismo objeto que GET /admin/usuarios/:id
```

Errores: `400` sin nada para cambiar o con formato inválido; `409` email/DNI
repetido (con `detalles.campos`).

### 5.5 Suspender / reactivar

```jsonc
// POST /admin/usuarios/:id/suspender   { "motivo": "Spam" }   (motivo opcional, hasta 300)
// → 200: el mismo objeto que GET /admin/usuarios/:id, con suspendida: true

// POST /admin/usuarios/:id/reactivar   (sin body)
// → 200: idem, con suspendida: false
```

**Qué hace la suspensión:**
- La persona **no puede iniciar sesión** (ni con contraseña ni con Google).
- Su sesión abierta **deja de valer al instante**: la próxima request responde
  `403` con `codigo: "CUENTA_SUSPENDIDA"`.
- **No borra nada**. Si su marca tiene otros dueños, ellos siguen trabajando.

No se puede suspender a un super_admin ni a uno mismo → `403`.

> Poné un diálogo de confirmación con un campo de texto opcional para el motivo.
> El motivo le llega a la persona en `detalles.motivo`.

### 5.6 Cerrar sesiones: `POST /admin/usuarios/:id/cerrar-sesiones`

Invalida **todos** sus tokens sin cambiarle la contraseña (ej.: perdió el
teléfono). Tiene que volver a iniciar sesión en todos lados.

```jsonc
// → 200
{ "mensaje": "Listo: tiene que volver a iniciar sesión en todos sus dispositivos" }
```

No aplica a super_admins ni a uno mismo → `403`.

### 5.7 Eliminar: `DELETE /admin/usuarios/:id`

**Irreversible.** Usa la misma baja que la persona puede pedir desde la app.
Pide confirmación explícita en el body:

```jsonc
// DELETE /admin/usuarios/:id
{ "confirmar": "ELIMINAR" }
```

| Caso | Qué pasa |
| --- | --- |
| No tiene marca | Se borra la cuenta |
| Su marca tiene **otros dueños** | Se borra la cuenta; la marca y sus datos quedan para los demás |
| Es el **único dueño** | **`409` con `codigo: "UNICO_DUENO"`**: borrarlo borra la marca entera |

El `409 UNICO_DUENO` trae la marca para mostrar qué se perdería:

```jsonc
{
  "error": "Es el único dueño de \"BebyRo\": eliminarlo borra la marca con todos sus clientes, facturas, tickets y pagos. Para confirmarlo mandá \"eliminarMarca\": true.",
  "codigo": "UNICO_DUENO",
  "detalles": {
    "marca": {
      "_id": "...", "nombre": "BebyRo",
      "estadisticas": { "cantidadClientes": 12, "totalVendido": 850000, "totalCobrado": 600000, "deudaPendiente": 250000 }
    }
  }
}
```

Para seguir, un **segundo diálogo** ("Se van a borrar 12 clientes y $250.000
de deuda anotada. ¿Seguro?") y reenviar con:

```jsonc
{ "confirmar": "ELIMINAR", "eliminarMarca": true }
// → 200
{ "mensaje": "Cuenta eliminada", "usuarioEliminado": true, "marcaEliminada": true, "datosDelNegocioEliminados": true }
```

Sin `"confirmar": "ELIMINAR"` → `400` con `detalles.campos.confirmar`.
No se puede eliminar a un super_admin ni a uno mismo → `403`.

**Flujo sugerido:**

```
[Eliminar] → diálogo "Escribí ELIMINAR" → DELETE { confirmar }
                 │
     200 ────────┴──── 409 UNICO_DUENO
      │                     │
   volver a la lista    diálogo con detalles.marca.estadisticas
                            │
                        DELETE { confirmar, eliminarMarca: true } → 200
```

---

## 6. Marcas

### 6.1 Listar: `GET /admin/marcas`

| Query | Valores | Default |
| --- | --- | --- |
| `buscar` | texto (nombre, sin importar tildes) | |
| `orden` | `nombre` \| `recientes` \| `vendido` \| `cobrado` \| `deuda` \| `clientes` | `nombre` |
| `actividad` | `activas` \| `inactivas` (ticket o pago en los últimos 30 días) | todas |
| `pagina`, `porPagina` | | 1, 20 |

```jsonc
// GET /admin/marcas?orden=vendido → 200
{
  "datos": [
    {
      "_id": "...",
      "nombre": "BebyRo",
      "direccion": "...", "telefono": "...", "logoUrl": "...",
      "colorPrimario": "#4a1866", "colorSecundario": "#f2c14e",
      "creadaPor": "6ab4...",
      "estadisticas": {
        "cantidadClientes": 1,
        "totalVendido": 50000,
        "totalCobrado": 15000,
        "deudaPendiente": 35000,
        "actualizadasEl": "..."
      },
      "duenos": [
        { "_id": "...", "nombre": "Ana", "email": "...", "dni": "...", "avatar": "...",
          "ultimoAcceso": "...", "suspendida": false }
      ],
      "puedeSubirLogo": true,
      "ultimaActividad": "2026-09-23T21:00:13.655Z",   // último ticket o pago cargado; null si nunca
      "createdAt": "...", "updatedAt": "..."
    }
  ],
  "total": 1, "pagina": 1, "porPagina": 20, "paginas": 1
}
```

**Columnas sugeridas:** logo + nombre · dueños (avatares) · clientes ·
vendido · deuda · última actividad ("hace 2 días", en gris si > 30 días).

> El viejo `GET /marcas` (solo super_admin) sigue funcionando, pero
> `/admin/marcas` trae además el orden, el filtro de actividad y
> `ultimaActividad`. Usá este.

### 6.2 Detalle: `GET /admin/marcas/:id`

```jsonc
// → 200
{
  "marca": {
    /* igual que en el listado (sin ultimaActividad) */
    "creadaPor": { "_id": "...", "nombre": "Ana", "email": "..." }   // o null si esa cuenta ya no existe
  },
  "uso": {
    "clientes": 1,
    "especies": 1,
    "facturas": { "abierta": 1, "pagada": 0, "anulada": 0, "vencidas": 0 },  // vencidas ⊂ abiertas con deuda
    "tickets":  { "total": 1, "anulados": 0, "ultimos30d": 1 },
    "pagos":    { "total": 1, "anulados": 0, "ultimos30d": 1 },
    "ultimaActividad": "2026-09-23T21:00:13.655Z",   // o null
    "activa": true                                   // actividad en los últimos 30 días
  }
}
```

Id inexistente → `404 { "error": "Marca no encontrada" }`.

### 6.3 Editar: `PUT /admin/marcas/:id`

Mismas reglas que `PUT /marcas/mia` (la edición del dueño): el front manda el
formulario **como quedó**.

```jsonc
{
  "nombre": "BebyRo Kids",     // requerido, hasta 80
  "direccion": "Calle 123",    // vacío o ausente → se borra
  "telefono": "",              // idem
  "colorPrimario": "#4A1866",  // solo cambia si viene; null o "" lo saca
  "colorSecundario": null
}
// → 200: el mismo objeto que GET /admin/marcas/:id
```

El logo no se toca desde acá (lo sube el dueño).

### 6.4 Dueños

```jsonc
// POST /admin/marcas/:id/duenos   { "dni": "30111444" }  → 201: GET /admin/marcas/:id
// DELETE /admin/marcas/:id/duenos/:usuarioId            → 200: GET /admin/marcas/:id
```

Mismas reglas que cuando lo hace un dueño:

| Error | Cuándo |
| --- | --- |
| `400` | DNI mal escrito · la cuenta no es de administrador · es el **último dueño** (la marca nunca queda sin dueños) |
| `404` | No hay cuenta con ese DNI · ese usuario no es dueño de esta marca |
| `409` | Ya es dueño de esta marca · ya tiene otra marca |

### 6.5 Recalcular estadísticas

Las `estadisticas` de cada marca se recalculan solas en cada cambio. Estos
botones son para **soporte**: si algún número no cierra, o después de tocar
datos a mano en la base.

```jsonc
// POST /admin/marcas/:id/recalcular → 200: la marca con dueños y estadísticas nuevas

// POST /admin/marcas/recalcular → 200 (todas, puede tardar unos segundos)
{ "recalculadas": 25, "fallidas": [], "milisegundos": 840 }
```

---

## 7. Errores de la app

La app manda sus errores a `POST /app/errores` (render que explota, error JS
fatal). Acá el super_admin los ve **agrupados**: el mismo error en 100
teléfonos es **un renglón** con `cantidad: 100`. Se agrupan por `huella`
(tipo + mensaje + dónde pasó).

> Mongo borra cada reporte a los **30 días**: no se puede mirar más atrás.
> Los mensajes ya vienen **redactados** (sin emails, DNIs ni tokens).

### 7.1 Listar: `GET /admin/errores`

| Query | Valores | Default |
| --- | --- | --- |
| `dias` | 1 a 30 | 7 |
| `plataforma` | `android` \| `ios` \| `web` | todas |
| `version` | versión exacta de la app, ej. `1.2.0` | todas |
| `fatal` | `true` \| `false` | todos |
| `buscar` | texto en el mensaje, el tipo o la pantalla | |
| `orden` | `recientes` (último visto) \| `frecuentes` (más veces) | `recientes` |
| `pagina`, `porPagina` | | 1, 20 |

```jsonc
// GET /admin/errores?orden=frecuentes → 200
{
  "dias": 7,
  "ocurrencias": 2,              // total de reportes en el filtro (todas las páginas)
  "datos": [
    {
      "huella": "1accb3a2a77f...",          // id del grupo, para el detalle
      "nombre": "TypeError",                // puede ser null
      "mensaje": "Cannot read x of undefined",
      "ruta": "/clientes/[id]",             // pantalla de expo-router; puede ser null
      "cantidad": 2,
      "fatales": 1,                         // cuántas de esas veces tiró la app abajo
      "usuariosAfectados": 2,
      "marcasAfectadas": 1,
      "versiones": ["1.2.0", "1.1.0"],
      "plataformas": ["android", "ios"],
      "primeraVez": "2026-09-23T21:00:13.697Z",
      "ultimaVez": "2026-09-23T21:00:13.720Z"
    }
  ],
  "total": 1,                    // cantidad de GRUPOS
  "pagina": 1, "porPagina": 20, "paginas": 1
}
```

**Renglón sugerido:** `nombre: mensaje` (en monoespaciado, recortado) · badge
rojo "FATAL" si `fatales > 0` · `cantidad` veces · `usuariosAfectados`
personas · íconos de `plataformas` · "visto hace 2 h".

### 7.2 Detalle: `GET /admin/errores/:huella`

Acepta los **mismos filtros** que el listado (`dias`, `plataforma`…) más
`pagina`/`porPagina` para las ocurrencias.

```jsonc
// GET /admin/errores/1accb3a2a77f...?dias=30 → 200
{
  "dias": 30,
  "grupo": { /* igual que un renglón del listado */ },
  "ocurrencias": {
    "datos": [
      {
        "_id": "...",
        "mensaje": "Cannot read x of undefined",
        "nombre": "TypeError",
        "stack": "TypeError: x\n at foo (a.js:1)",   // mostrar en <pre>
        "componentStack": "...",                    // árbol de React; puede no venir
        "ruta": "/clientes/[id]",
        "fatal": true,
        "version": "1.2.0",
        "plataforma": "android",
        "versionSO": "14",
        "dispositivo": "Pixel 7",
        "ocurridoEn": "...",                        // hora del teléfono
        "createdAt": "...",                         // hora en que llegó
        "usuario": { "_id": "...", "nombre": "Ana", "email": "..." },   // null si no estaba logueado o ya no existe
        "marca": { "_id": "...", "nombre": "BebyRo" }                  // idem
      }
    ],
    "total": 2, "pagina": 1, "porPagina": 20, "paginas": 1
  }
}
```

Sin reportes para esa huella (en ese filtro) → `404 { "error": "Error no encontrado" }`.

### 7.3 Marcar resuelto: `DELETE /admin/errores/:huella`

"Ya lo arreglé": borra **todos** los reportes de ese grupo. Si el error
vuelve a pasar, reaparece como nuevo.

```jsonc
// → 200
{ "mensaje": "Error marcado como resuelto", "borrados": 2 }
```

---

## 8. Sistema: `GET /admin/sistema`

El estado técnico. Solo lectura; sugerido un botón "Refrescar". Nunca
devuelve secretos: de cada servicio dice solo si está configurado.

```jsonc
// → 200
{
  "generadoEl": "...",
  "servidor": {
    "entorno": "production",
    "node": "v22.22.2",
    "uptimeSegundos": 48,
    "iniciadoEl": "...",                 // último reinicio / deploy
    "memoria": { "rssMb": 143.6, "heapUsadoMb": 40.7, "heapTotalMb": 48.5 }
  },
  "mongo": {
    "estado": "conectado",               // conectado | conectando | desconectando | desconectado
    "base": "facturacion",
    "tamano": { "datosMb": 12.3, "almacenamientoMb": 8.1, "indicesMb": 2.4 },   // null si el plan no lo permite
    "colecciones": [
      { "nombre": "tickets", "documentos": 1520, "tamanoMb": 3.2 }             // tamanoMb null si el plan no lo permite
    ]
  },
  "servicios": {
    "email": true,                       // SMTP configurado (recuperar contraseña, facturas por mail)
    "cloudinary": true,                  // logos de marca
    "google": true                       // login con Google
  },
  "app": {
    "minima": "1.1.0",                   // APP_VERSION_MINIMA: más viejas reciben 426
    "ultima": "1.2.0",                   // o null
    "urlTienda": "https://play.google.com/...",
    "versionDocumentosLegales": "2026-09-17",
    "versionesEnUso": [                  // de los que entraron en los últimos 30 días
      { "version": "1.2.0", "usuarios": 18, "bloqueada": false },
      { "version": "1.0.3", "usuarios": 2,  "bloqueada": true },   // ya reciben "actualizá la app"
      { "version": "desconocida", "usuarios": 1, "bloqueada": false }  // web / sin header
    ]
  }
}
```

**Sugerencias de UI:** semáforo por servicio (verde/rojo); gráfico de torta de
`versionesEnUso`, con las `bloqueada` en rojo — sirve para decidir cuándo
subir `APP_VERSION_MINIMA` sin dejar a mucha gente afuera.

---

## 9. Cambios que afectan a la app del administrador

Para que el panel tenga datos, la API ahora registra y controla dos cosas
nuevas en **todas** las cuentas. Afectan al front de la app de siempre:

### 9.1 Mandar siempre `X-App-Version`

Cada request autenticada guarda el **último acceso** de la cuenta (como mucho
una escritura cada 5 minutos) y, si viene el header `X-App-Version`, la
**versión de la app**. Ya se manda para el chequeo de versión mínima: solo
confirmar que va en **todas** las requests. Sin el header, la versión figura
como `"desconocida"` en el panel.

### 9.2 Manejar `403 CUENTA_SUSPENDIDA`

Si el super_admin suspende una cuenta, cualquier request (o el login, o
Google) responde:

```jsonc
// 403
{
  "error": "Tu cuenta está suspendida. Escribinos si creés que es un error.",
  "codigo": "CUENTA_SUSPENDIDA",
  "detalles": { "motivo": "Spam" }   // solo si el super_admin escribió un motivo
}
```

**En el `client.ts` del front**, en el mismo lugar donde se manejan el `401` y
el `403` con `detalles.pendiente`:

```ts
if (res.status === 403 && body?.codigo === "CUENTA_SUSPENDIDA") {
  await cerrarSesionLocal();                  // borrar el token guardado
  navegar("/cuenta-suspendida", { motivo: body.detalles?.motivo });
  // …y seguir tirando el ApiError de siempre, para que la pantalla que llamó no siga.
}
```

La pantalla "Cuenta suspendida" muestra `error` (y `motivo` si vino) y un
botón para volver al login. **No** reintentar: va a seguir respondiendo 403
hasta que el super_admin la reactive.

### 9.3 `401` después de "cerrar sesiones"

Cuando el super_admin cierra las sesiones de alguien, sus tokens responden
`401` (como cuando cambia la contraseña). El front ya cierra la sesión ante
cualquier `401`: no hay nada nuevo que hacer.

---

## 10. Tipos TypeScript

```ts
// ─── Comunes ───
export interface Paginado<T> {
  datos: T[];
  total: number;
  pagina: number;
  porPagina: number;
  paginas: number;
}

export type Pendiente = "terminos" | "perfil" | "marca" | null;
export type Proveedor = "local" | "google";
export type Rol = "super_admin" | "administrador";
export type Plataforma = "android" | "ios" | "web";

export interface EstadisticasMarca {
  cantidadClientes: number;
  totalVendido: number;
  totalCobrado: number;
  deudaPendiente: number;
  actualizadasEl?: string;
}

// ─── Resumen ───
export interface ResumenPlataforma {
  generadoEl: string;
  usuarios: {
    administradores: number;
    superAdmins: number;
    porProveedor: Record<Proveedor, number>;
    nuevos: { hoy: number; ultimos7d: number; ultimos30d: number };
    activos: { ultimos7d: number; ultimos30d: number };
    suspendidos: number;
    pendientes: { terminos: number; perfil: number; marca: number };
  };
  marcas: { total: number; nuevas30d: number; activas30d: number; inactivas30d: number; conLogo: number };
  negocio: {
    clientes: number;
    facturasConDeuda: number;
    facturasVencidas: number;
    historico: { vendido: number; cobrado: number; deudaPendiente: number };
    ultimos30d: { tickets: number; pagos: number; vendido: number; cobrado: number };
  };
  errores: { ultimas24h: number; ultimos7d: number; fatales7d: number; distintos7d: number };
  recientes: {
    usuarios: Array<{
      _id: string; nombre: string; email: string; avatar?: string;
      proveedor: Proveedor; createdAt: string; marca?: { _id: string; nombre: string };
    }>;
    marcas: Array<{ _id: string; nombre: string; logoUrl?: string; createdAt: string; estadisticas: EstadisticasMarca }>;
  };
}

// ─── Crecimiento ───
export interface TramoCrecimiento {
  periodo: string;            // "2026-09-23" o "2026-09"
  usuarios: number;
  marcas: number;
  tickets: number;
  pagos: number;
  vendido: number;
  cobrado: number;
}
export interface Crecimiento {
  agrupar: "dia" | "mes";
  desde: string;
  hasta: string;
  serie: TramoCrecimiento[];
  totales: Omit<TramoCrecimiento, "periodo">;
}

// ─── Usuarios ───
export interface UsuarioAdmin {
  _id: string;
  nombre: string;
  email: string;
  rol: Rol;
  proveedor: Proveedor;
  dni?: string;
  avatar?: string;
  aceptoTerminosYCondiciones: boolean;
  terminosYCondicionesVersion?: string;
  terminosYCondicionesAceptadosEn?: string;
  ultimoAcceso?: string;
  ultimaVersionApp?: string;
  suspendida: boolean;
  suspendidaEl?: string;
  motivoSuspension?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioEnListado extends UsuarioAdmin {
  marca?: { _id: string; nombre: string; logoUrl?: string };
  pendiente: Pendiente;
}

export interface DetalleUsuario {
  usuario: UsuarioAdmin & { marca?: string };
  pendiente: Pendiente;
  marca: MarcaConDuenos | null;
  actividad: {
    ultimoAcceso: string | null;
    ultimaVersionApp: string | null;
    ticketsRegistrados: number;
    pagosRegistrados: number;
    ultimoTicketEl: string | null;
    ultimoPagoEl: string | null;
    erroresApp30d: number;
  };
}

export interface FiltrosUsuarios {
  buscar?: string;
  rol?: Rol;
  proveedor?: Proveedor;
  onboarding?: "terminos" | "perfil" | "marca" | "listo";
  suspendida?: boolean;
  activosDias?: number;
  inactivosDias?: number;
  orden?: "recientes" | "antiguos" | "nombre" | "ultimoAcceso";
  pagina?: number;
  porPagina?: number;
}

// ─── Marcas ───
export interface DuenoAdmin {
  _id: string;
  nombre: string;
  email: string;
  dni?: string;
  avatar?: string;
  ultimoAcceso?: string;
  suspendida?: boolean;
}

export interface MarcaConDuenos {
  _id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  logoUrl?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  creadaPor: string | { _id: string; nombre: string; email: string } | null;
  estadisticas: EstadisticasMarca;
  duenos: DuenoAdmin[];
  puedeSubirLogo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarcaEnListado extends MarcaConDuenos {
  ultimaActividad: string | null;
}

export interface DetalleMarca {
  marca: MarcaConDuenos;
  uso: {
    clientes: number;
    especies: number;
    facturas: { abierta: number; pagada: number; anulada: number; vencidas: number };
    tickets: { total: number; anulados: number; ultimos30d: number };
    pagos: { total: number; anulados: number; ultimos30d: number };
    ultimaActividad: string | null;
    activa: boolean;
  };
}

export interface FiltrosMarcas {
  buscar?: string;
  orden?: "nombre" | "recientes" | "vendido" | "cobrado" | "deuda" | "clientes";
  actividad?: "activas" | "inactivas";
  pagina?: number;
  porPagina?: number;
}

// ─── Errores ───
export interface GrupoError {
  huella: string;
  nombre: string | null;
  mensaje: string;
  ruta: string | null;
  cantidad: number;
  fatales: number;
  usuariosAfectados: number;
  marcasAfectadas: number;
  versiones: string[];
  plataformas: Plataforma[];
  primeraVez: string;
  ultimaVez: string;
}

export interface OcurrenciaError {
  _id: string;
  mensaje: string;
  nombre?: string;
  stack?: string;
  componentStack?: string;
  ruta?: string;
  fatal: boolean;
  version: string;
  plataforma: Plataforma;
  versionSO?: string;
  dispositivo?: string;
  ocurridoEn: string;
  createdAt: string;
  usuario: { _id: string; nombre: string; email: string } | null;
  marca: { _id: string; nombre: string } | null;
}

export interface FiltrosErrores {
  dias?: number;              // 1-30
  plataforma?: Plataforma;
  version?: string;
  fatal?: boolean;
  buscar?: string;
  orden?: "recientes" | "frecuentes";
  pagina?: number;
  porPagina?: number;
}

export type ListadoErrores = Paginado<GrupoError> & { dias: number; ocurrencias: number };
export interface DetalleError {
  dias: number;
  grupo: GrupoError;
  ocurrencias: Paginado<OcurrenciaError>;
}

// ─── Sistema ───
export interface EstadoSistema {
  generadoEl: string;
  servidor: {
    entorno: string;
    node: string;
    uptimeSegundos: number;
    iniciadoEl: string;
    memoria: { rssMb: number; heapUsadoMb: number; heapTotalMb: number };
  };
  mongo: {
    estado: "conectado" | "conectando" | "desconectando" | "desconectado" | "desconocido";
    base: string;
    tamano: { datosMb: number; almacenamientoMb: number; indicesMb: number } | null;
    colecciones: Array<{ nombre: string; documentos: number; tamanoMb: number | null }>;
  };
  servicios: { email: boolean; cloudinary: boolean; google: boolean };
  app: {
    minima: string;
    ultima: string | null;
    urlTienda: string;
    versionDocumentosLegales: string;
    versionesEnUso: Array<{ version: string; usuarios: number; bloqueada: boolean }>;
  };
}
```

---

## 11. Cliente de API sugerido

Asume el `api()` / `ApiError` que ya usa el front (ver `README-FRONTEND.md`).

> **Ojo:** el `ApiError` de `README-FRONTEND.md` guarda `status`, `detalles` y
> `reintentarEn`, pero **no `codigo`**. El panel lo necesita (`UNICO_DUENO`,
> `CUENTA_SUSPENDIDA`): sumale un campo `readonly codigo?: string` y llenalo
> con `body.codigo` al construirlo. `detalles` además puede traer objetos (no
> solo textos por campo), así que conviene tiparlo como `Record<string, unknown>`.

```ts
// services/admin.ts
import { api } from "./client";

/** Arma "?a=1&b=2" salteando lo vacío. */
function qs(filtros: object = {}): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filtros)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const adminApi = {
  // Tablero
  resumen: () => api<ResumenPlataforma>("/admin/resumen"),
  crecimiento: (f: { agrupar?: "dia" | "mes"; dias?: number; meses?: number } = {}) =>
    api<Crecimiento>(`/admin/crecimiento${qs(f)}`),
  sistema: () => api<EstadoSistema>("/admin/sistema"),

  // Usuarios
  usuarios: (f: FiltrosUsuarios = {}) => api<Paginado<UsuarioEnListado>>(`/admin/usuarios${qs(f)}`),
  usuario: (id: string) => api<DetalleUsuario>(`/admin/usuarios/${id}`),
  crearUsuario: (body: { nombre: string; email: string; password: string; rol?: Rol; dni?: string }) =>
    api<UsuarioEnListado>("/admin/usuarios", { method: "POST", body }),
  editarUsuario: (id: string, body: { nombre?: string; email?: string; dni?: string | null }) =>
    api<DetalleUsuario>(`/admin/usuarios/${id}`, { method: "PUT", body }),
  suspender: (id: string, motivo?: string) =>
    api<DetalleUsuario>(`/admin/usuarios/${id}/suspender`, { method: "POST", body: { motivo } }),
  reactivar: (id: string) => api<DetalleUsuario>(`/admin/usuarios/${id}/reactivar`, { method: "POST" }),
  cerrarSesiones: (id: string) =>
    api<{ mensaje: string }>(`/admin/usuarios/${id}/cerrar-sesiones`, { method: "POST" }),
  eliminarUsuario: (id: string, eliminarMarca = false) =>
    api<{ mensaje: string; usuarioEliminado: boolean; marcaEliminada: boolean; datosDelNegocioEliminados: boolean }>(
      `/admin/usuarios/${id}`,
      { method: "DELETE", body: { confirmar: "ELIMINAR", ...(eliminarMarca && { eliminarMarca: true }) } }
    ),

  // Marcas
  marcas: (f: FiltrosMarcas = {}) => api<Paginado<MarcaEnListado>>(`/admin/marcas${qs(f)}`),
  marca: (id: string) => api<DetalleMarca>(`/admin/marcas/${id}`),
  editarMarca: (id: string, body: { nombre: string; direccion?: string; telefono?: string; colorPrimario?: string | null; colorSecundario?: string | null }) =>
    api<DetalleMarca>(`/admin/marcas/${id}`, { method: "PUT", body }),
  sumarDueno: (id: string, dni: string) =>
    api<DetalleMarca>(`/admin/marcas/${id}/duenos`, { method: "POST", body: { dni } }),
  sacarDueno: (id: string, usuarioId: string) =>
    api<DetalleMarca>(`/admin/marcas/${id}/duenos/${usuarioId}`, { method: "DELETE" }),
  recalcularMarca: (id: string) => api<MarcaConDuenos>(`/admin/marcas/${id}/recalcular`, { method: "POST" }),
  recalcularTodas: () =>
    api<{ recalculadas: number; fallidas: string[]; milisegundos: number }>("/admin/marcas/recalcular", { method: "POST" }),

  // Errores
  errores: (f: FiltrosErrores = {}) => api<ListadoErrores>(`/admin/errores${qs(f)}`),
  error: (huella: string, f: FiltrosErrores = {}) => api<DetalleError>(`/admin/errores/${huella}${qs(f)}`),
  resolverError: (huella: string) =>
    api<{ mensaje: string; borrados: number }>(`/admin/errores/${huella}`, { method: "DELETE" }),
};
```

**Eliminar con el doble paso:**

```ts
async function eliminar(usuario: UsuarioEnListado) {
  if (!(await confirmarEscribiendo("ELIMINAR"))) return;
  try {
    await adminApi.eliminarUsuario(usuario._id);
  } catch (e) {
    if (e instanceof ApiError && e.codigo === "UNICO_DUENO") {
      const { marca } = e.detalles as { marca: { nombre: string; estadisticas: EstadisticasMarca } };
      const ok = await confirmar(
        `Se borra también "${marca.nombre}": ${marca.estadisticas.cantidadClientes} clientes ` +
        `y $${marca.estadisticas.deudaPendiente} de deuda anotada. No se puede deshacer.`
      );
      if (ok) await adminApi.eliminarUsuario(usuario._id, true);
      else return;
    } else throw e;
  }
  volverALaLista();
}
```

---

## 12. Tabla de todos los endpoints

Todos con `Authorization: Bearer <token de super_admin>`.

| Método | Ruta | Para qué | Respuesta |
| --- | --- | --- | --- |
| `GET` | `/admin/resumen` | Números del tablero | `ResumenPlataforma` |
| `GET` | `/admin/crecimiento` | Serie para gráficos (`agrupar`, `dias`, `meses`) | `Crecimiento` |
| `GET` | `/admin/sistema` | Estado técnico | `EstadoSistema` |
| `GET` | `/admin/usuarios` | Listar cuentas con filtros | `Paginado<UsuarioEnListado>` |
| `POST` | `/admin/usuarios` | Crear cuenta | `201 UsuarioEnListado` |
| `GET` | `/admin/usuarios/:id` | Detalle de una cuenta | `DetalleUsuario` |
| `PUT` | `/admin/usuarios/:id` | Corregir nombre, email o DNI | `DetalleUsuario` |
| `POST` | `/admin/usuarios/:id/suspender` | Suspender (`{ motivo? }`) | `DetalleUsuario` |
| `POST` | `/admin/usuarios/:id/reactivar` | Reactivar | `DetalleUsuario` |
| `POST` | `/admin/usuarios/:id/cerrar-sesiones` | Invalidar todos sus tokens | `{ mensaje }` |
| `DELETE` | `/admin/usuarios/:id` | Eliminar (`{ confirmar, eliminarMarca? }`) | `{ mensaje, ... }` |
| `GET` | `/admin/marcas` | Listar marcas con orden y actividad | `Paginado<MarcaEnListado>` |
| `GET` | `/admin/marcas/:id` | Detalle y uso de una marca | `DetalleMarca` |
| `PUT` | `/admin/marcas/:id` | Editar textos y colores | `DetalleMarca` |
| `POST` | `/admin/marcas/:id/duenos` | Sumar dueño por DNI | `201 DetalleMarca` |
| `DELETE` | `/admin/marcas/:id/duenos/:usuarioId` | Sacar dueño | `DetalleMarca` |
| `POST` | `/admin/marcas/:id/recalcular` | Recalcular una marca | `MarcaConDuenos` |
| `POST` | `/admin/marcas/recalcular` | Recalcular todas | `{ recalculadas, fallidas, milisegundos }` |
| `GET` | `/admin/errores` | Errores de la app agrupados | `ListadoErrores` |
| `GET` | `/admin/errores/:huella` | Un grupo con cada ocurrencia | `DetalleError` |
| `DELETE` | `/admin/errores/:huella` | Marcar resuelto | `{ mensaje, borrados }` |

**Siguen existiendo** (de antes, solo super_admin) y funcionan igual:
`GET/POST /usuarios`, `PUT /usuarios/:id/dni`, `DELETE /usuarios/:id` y
`GET /marcas`. Para el panel nuevo usá las de `/admin`: traen más datos, y
`DELETE /admin/usuarios/:id` además limpia el rastro de la cuenta en los
tickets y pagos (el viejo no).

### Códigos de error que el panel tiene que conocer

| Status | `codigo` | Cuándo | Qué hacer |
| --- | --- | --- | --- |
| `400` | — | Query o body inválido | Mostrar `detalles.campos[campo]` bajo el input, o `error` en un toast |
| `401` | — | Token vencido o inválido | Cerrar sesión e ir al login |
| `403` | — | No es super_admin, o acción sobre un super_admin / uno mismo | Toast con `error` |
| `404` | — | Usuario, marca o error inexistente | Volver a la lista |
| `409` | `UNICO_DUENO` | Eliminar al único dueño de una marca | Segundo diálogo, reenviar con `eliminarMarca: true` |
| `409` | — | Email o DNI repetido; dueño que ya está en una marca | `detalles.campos` o toast |
