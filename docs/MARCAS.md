# Marcas

La marca es **el negocio** dentro de la app: "BebyRo", "JuniorPres". Todo lo
del negocio —clientes, especies, productos, facturas, tickets, pagos— **es de
la marca**, no de un usuario.

Una marca puede tener **varios dueños, todos iguales**. Ella y él manejan
BebyRo: cualquiera de los dos entra con su cuenta y hace exactamente lo mismo.
Ven los mismos clientes, cargan tickets en las mismas facturas y la numeración
es una sola.

- **Base:** `http://localhost:4000`
- **Auth:** pide `Authorization: Bearer <token>`
- **Errores:** siempre `{ error, detalles? }`

---

## Las reglas

| Regla | Qué significa |
| --- | --- |
| **Sin marca no se opera** | Todo administrador tiene que crear su marca (o que lo sumen a una) antes de usar la app |
| **Primero el DNI** | Para crear o sumarse a una marca hay que cargar el DNI |
| **Una sola marca por usuario** | No se pasa de BebyRo a JuniorPres. Puede editar la suya, no cambiarse |
| **N dueños, todos iguales** | Cualquier dueño edita la marca, sube el logo, suma o saca dueños |
| **Se suma por DNI, al instante** | Solo a alguien que ya tiene cuenta, con su DNI cargado y sin marca |
| **Nunca sin dueños** | El último dueño no puede irse ni ser borrado |
| **El que se va no se lleva nada** | Queda sin marca y vuelve a empezar; los datos quedan en la marca |
| **El DNI no se cambia** | Se carga una vez. Si está mal, lo corrige el super_admin |

---

## El onboarding: `pendiente`

Después de registrarse, al usuario le pueden faltar dos cosas, en este orden:

```
registro ──► pendiente: "perfil" ──► PUT /auth/me/perfil { dni }
                                          │
                        pendiente: "marca" ◄┘
                          │                │
              POST /marcas { nombre }     o un dueño lo suma con su DNI
                          │                │
                          └──► pendiente: null ──► usa la app
```

**`pendiente` viene en la sesión** (registro, login, Google, `GET /auth/me`),
así el front sabe qué pantalla mostrar sin preguntar dos veces:

| `pendiente` | Pantalla |
| --- | --- |
| `"perfil"` | "Completá tu perfil": pedir el DNI |
| `"marca"` | "Creá tu marca" · o "Esperá a que te sumen: pasale tu DNI a tu socio" |
| `null` | La app |

**Si igual llama a una ruta del negocio**, responde `403` con el mismo dato,
así cualquier pantalla puede mandar al onboarding:

```jsonc
// GET /clientes sin DNI
{ "error": "Completá tu perfil con tu DNI antes de empezar", "detalles": { "pendiente": "perfil" } }

// GET /clientes con DNI y sin marca
{ "error": "Creá tu marca o pedile a un dueño que te sume con tu DNI", "detalles": { "pendiente": "marca" } }
```

> En el `client.ts` del front conviene atraparlo en un solo lugar: si
> `status === 403` y viene `detalles.pendiente`, navegar a esa pantalla.

El super_admin no tiene marca ni `pendiente`: administra la app, no opera un
negocio. Si llama a una ruta del negocio recibe `403`.

---

## Los endpoints

| Método | Ruta | Para qué |
| --- | --- | --- |
| `PUT` | `/auth/me/perfil` | Cargar el DNI (una vez) |
| `GET` | `/auth/me` | El usuario, su marca con los dueños, y `pendiente` |
| `POST` | `/marcas` | Crear la marca propia |
| `GET` | `/marcas/mia` | La marca: datos, dueños y estadísticas |
| `PUT` | `/marcas/mia` | Editar nombre, dirección y teléfono |
| `POST` | `/marcas/mia/logo/firma` | Paso 1 del logo |
| `PUT` | `/marcas/mia/logo` | Paso 2 del logo |
| `DELETE` | `/marcas/mia/logo` | Sacar el logo |
| `POST` | `/marcas/mia/duenos` | Sumar un dueño por DNI |
| `DELETE` | `/marcas/mia/duenos/:usuarioId` | Sacar a un dueño, o irse (el propio id) |
| `GET` | `/marcas` | **super_admin:** todas las marcas con dueños y números |
| `PUT` | `/usuarios/:id/dni` | **super_admin:** corregir un DNI |

---

## PUT /auth/me/perfil

```jsonc
{ "dni": "30.111.222" }   // con o sin puntos
```

Se guarda normalizado (`"30111222"`): el mismo DNI escrito de las dos maneras
no pasa como dos personas. Tiene que tener **7 u 8 números**.

```jsonc
// 200
{ "usuario": { "_id": "…", "nombre": "Ana", "dni": "30111222", … }, "pendiente": "marca" }
```

| Caso | Status | `error` |
| --- | --- | --- |
| DNI con menos de 7 o más de 8 números | 400 | `El DNI tiene que tener 7 u 8 números` + `detalles: { campo: "dni" }` |
| Ya tenía DNI | 400 | `Tu DNI ya está cargado. Si hay que corregirlo, pedíselo al administrador de la app.` |
| Otra cuenta ya tiene ese DNI | 409 | `Ese DNI ya está registrado en otra cuenta` |

---

## POST /marcas — crear la marca

```jsonc
{ "nombre": "BebyRo", "direccion": "Av. Siempreviva 742", "telefono": "11 4444-5555" }
```

| Campo | Regla |
| --- | --- |
| `nombre` | Requerido, hasta 80. Va grande en el PDF |
| `direccion` | Opcional, hasta 120 |
| `telefono` | Opcional, hasta 40 |

Quien la crea queda como primer dueño. Responde `201` con la marca, igual que
`GET /marcas/mia`:

```jsonc
{
  "_id": "6aa41c2a703f7d589d40cbfe",
  "nombre": "BebyRo",
  "direccion": "Av. Siempreviva 742",
  "telefono": "11 4444-5555",
  "logoUrl": "https://res.cloudinary.com/<cloud>/image/upload/v1789…/marcas/6aa41c2a…/logo",
  "puedeSubirLogo": true,
  "creadaPor": "6aa41c29703f7d589d40cbf3",
  "estadisticas": {
    "cantidadClientes": 2,
    "totalVendido": 11000,
    "totalCobrado": 2000,
    "deudaPendiente": 9000,
    "actualizadasEl": "2026-09-11T15:20:11.254Z"
  },
  "duenos": [
    { "_id": "6aa41c29703f7d589d40cbf3", "nombre": "Ana", "email": "ana@…", "dni": "30111222" },
    { "_id": "6aa41c29703f7d589d40cbf9", "nombre": "Beto", "email": "beto@…", "dni": "28456789" }
  ]
}
```

| Caso | Status | `error` |
| --- | --- | --- |
| Sin nombre | 400 | `La marca necesita un nombre` |
| Un campo que no es texto o muy largo | 400 | `El campo "direccion" puede tener hasta 120 caracteres` |
| Todavía sin DNI | 403 | `Completá tu perfil con tu DNI antes de crear tu marca` + `detalles: { pendiente: "perfil" }` |
| Ya tiene marca | 409 | `Ya tenés una marca` |
| Es super_admin | 403 | `El super_admin no tiene marca…` |

## PUT /marcas/mia — editar

Mismo body que el alta. **Reemplaza los textos**: el front manda el formulario
como quedó. El nombre es obligatorio; dirección o teléfono vacíos se borran.
El logo no se toca. Lo puede hacer cualquier dueño.

---

## Los dueños

### POST /marcas/mia/duenos — sumar

```jsonc
{ "dni": "28456789" }
```

Entra **al instante**. Responde `201` con la marca y la lista de dueños nueva.

| Caso | Status | `error` |
| --- | --- | --- |
| DNI inválido | 400 | `El DNI tiene que tener 7 u 8 números` |
| Nadie tiene ese DNI | 404 | `No hay ninguna cuenta con ese DNI. Tiene que registrarse y cargar su DNI primero` |
| Ya es dueño de esta marca | 409 | `Esa persona ya es dueña de esta marca` |
| Tiene otra marca | 409 | `Esa persona ya tiene su propia marca` |
| Es super_admin | 400 | `Esa cuenta no puede sumarse a una marca` |

> **Por eso el orden del onboarding importa:** si tu socio ya creó su propia
> marca, no lo podés sumar. Tiene que registrarse, cargar el DNI y **esperar**
> a que lo sumes, sin crear una.

### DELETE /marcas/mia/duenos/:usuarioId — sacar, o irse

Cualquier dueño saca a otro. Con el **propio** id, se va:

```jsonc
// sacar a otro → 200, la marca con la lista nueva
// irse → 200
{ "mensaje": "Saliste de BebyRo", "marca": null, "pendiente": "marca" }
```

El que sale queda **sin marca**: vuelve a la pantalla de "creá tu marca o
esperá que te sumen". **No se lleva nada**: los clientes, tickets y pagos que
cargó quedan en la marca, con su nombre en `registradoPor`.

| Caso | Status | `error` |
| --- | --- | --- |
| Es el último dueño | 400 | `Es el único dueño: la marca no puede quedar sin dueños. Sumá a alguien antes de salir.` |
| No es dueño de esta marca | 404 | `Dueño no encontrado` |

---

## El logo

**Uno por marca, y punto.** El archivo en Cloudinary se llama siempre
`marcas/<id de la marca>/logo` y cambiarlo pisa al anterior: aunque lo suban
los dos dueños, diez veces cada uno, queda uno solo. El detalle de la subida
(firma, Cloudinary, `version`) está en
[FACTURA_PDF.md](FACTURA_PDF.md#el-logo-uno-por-marca-y-punto); lo único que
cambió son las rutas, que ahora cuelgan de `/marcas/mia/logo`.

**`puedeSubirLogo`** viene en toda respuesta con la marca (`GET /marcas/mia`,
`/auth/me`, el alta, las del logo y las de dueños). Es `true` cuando el server
tiene Cloudinary configurado: con `false`, la app no muestra el botón de logo
(pedir la firma daría `503`). No depende de la marca ni de si ya tiene logo:
para eso está `logoUrl`.

| `puedeSubirLogo` | `logoUrl` | La pantalla muestra |
| --- | --- | --- |
| `true` | no viene | [ Subir logo ] |
| `true` | viene | El logo, [ Cambiar logo ] y "Sacar logo" |
| `false` | no viene | Nada de logo |
| `false` | viene | El logo, sin botones para cambiarlo |

---

## Las estadísticas

Lo que mueve la marca, en `estadisticas`:

| Campo | Qué es |
| --- | --- |
| `cantidadClientes` | Clientes de la marca |
| `totalVendido` | Todo lo que se llevaron: Σ total de los tickets, **sin anulados** |
| `totalCobrado` | La plata que entró: lo que dejaron al comprar + los pagos a cuenta, **sin anulados** |
| `deudaPendiente` | Lo que le deben hoy: Σ saldo de las facturas no anuladas que deben algo |
| `actualizadasEl` | Cuándo se recalcularon por última vez |

**Se guardan, pero nunca se suman a mano:** se recalculan desde cero cada vez
que se carga un cliente, un ticket o un pago, o se anula algo. Igual que los
totales de la factura, no se pueden desfasar.

```
2 clientes · Rosa: ticket $10.000 (dejó $2.000) · Luz: ticket $10.000 · pago de Rosa $3.000

totalVendido    $20.000   10.000 + 10.000
totalCobrado    $ 5.000    2.000 +  3.000
deudaPendiente  $15.000    Rosa 5.000 + Luz 10.000

anulan el ticket de Luz  →  vendido 10.000 · deuda 5.000
anulan el pago de Rosa   →  cobrado  2.000 · deuda 8.000
```

---

## El super_admin

### GET /marcas

Todas las marcas, **paginado**, con sus dueños y estadísticas. Query:
`buscar` (en el nombre), `pagina`, `porPagina` (hasta 100).

```jsonc
{ "datos": [ /* marcas, como GET /marcas/mia */ ], "total": 12, "pagina": 1, "porPagina": 20, "paginas": 1 }
```

### PUT /usuarios/:id/dni

```jsonc
{ "dni": "30111223" }
```

Para corregir un DNI mal cargado. Un DNI de otra cuenta responde `409`.

### DELETE /usuarios/:id

Si el usuario es el **único dueño** de su marca, responde `400`: la marca no
puede quedar sin dueños. Primero hay que sumar a otro.

---

## Qué cambió en el resto de la app

- **Todas las rutas del negocio** (`/clientes`, `/especies`, `/productos`,
  `/facturas`, tickets, pagos, PDF) filtran por **la marca**, no por el usuario.
  Un dueño ve todo lo de la marca, lo haya cargado quien lo haya cargado.
- **`registradoPor`** en tickets y pagos dice **cuál de los dueños** lo cargó.
- **La numeración de facturas es por marca**: la 0001 la cierra Ana, la 0002
  Beto.
- **El PDF y el link público** salen con el nombre y el logo de la marca.
- **Las rutas `/auth/me/marca*` ya no existen**: ahora son `/marcas/mia*`.
- **`PUT /productos/:id`** solo acepta `nombre, talle, precio, stock, activo,
  especie`, y la especie tiene que ser de la marca. Antes guardaba el body
  entero y se podía pasar un producto a otra cuenta.

---

## El servicio en el front

```ts
// src/api/marcas.service.ts
import { request } from "./client";

export type Pendiente = "perfil" | "marca" | null;

export interface Dueno {
  _id: string;
  nombre: string;
  email: string;
  dni: string;
  avatar?: string;
}

export interface Marca {
  _id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  logoUrl?: string;
  creadaPor: string;
  duenos: Dueno[];
  estadisticas: {
    cantidadClientes: number;
    totalVendido: number;
    totalCobrado: number;
    deudaPendiente: number;
    actualizadasEl?: string;
  };
}

export interface DatosMarca {
  nombre: string;
  direccion?: string;
  telefono?: string;
}

export const marcasService = {
  /** El DNI, una sola vez. Acepta "30.111.222". */
  completarPerfil(dni: string) {
    return request<{ usuario: unknown; pendiente: Pendiente }>("/auth/me/perfil", {
      method: "PUT",
      body: { dni },
    });
  },

  crear(datos: DatosMarca) {
    return request<Marca>("/marcas", { method: "POST", body: datos });
  },

  mia() {
    return request<Marca>("/marcas/mia");
  },

  /** Reemplaza los textos: mandá el formulario como quedó. */
  editar(datos: DatosMarca) {
    return request<Marca>("/marcas/mia", { method: "PUT", body: datos });
  },

  sumarDueno(dni: string) {
    return request<Marca>("/marcas/mia/duenos", { method: "POST", body: { dni } });
  },

  sacarDueno(usuarioId: string) {
    return request<Marca>(`/marcas/mia/duenos/${usuarioId}`, { method: "DELETE" });
  },

  /** Irse de la marca: queda sin marca y vuelve al onboarding. */
  irme(miId: string) {
    return request<{ mensaje: string; marca: null; pendiente: "marca" }>(
      `/marcas/mia/duenos/${miId}`,
      { method: "DELETE" }
    );
  },
};

/** A qué pantalla va, según la sesión. */
export function pantallaInicial(pendiente: Pendiente): "perfil" | "marca" | "app" {
  return pendiente ?? "app";
}
```

---

## Las pantallas

### Completá tu perfil

```
┌────────────────────────────────────────────┐
│  Completá tu perfil                        │
│  Tu DNI identifica tu cuenta: con él tu    │
│  socio te puede sumar a su marca.          │
│                                            │
│  DNI   [ 30.111.222            ]           │
│  No se puede cambiar después.              │
│                                            │
│              [ Continuar ]                 │
└────────────────────────────────────────────┘
```

### Tu marca

```
┌────────────────────────────────────────────┐
│  ¿Cómo se llama tu negocio?                │
│                                            │
│  Nombre     [ BebyRo                ]      │
│  Dirección  [                       ]      │
│  Teléfono   [                       ]      │
│              [ Crear mi marca ]            │
│ ────────────────── o ───────────────────── │
│  ¿Tu socio ya tiene la marca creada?       │
│  Pasale tu DNI 30.111.222 para que te sume │
│  y tocá [ Ya me sumó ]                     │
└────────────────────────────────────────────┘
```

"Ya me sumó" vuelve a pedir `GET /auth/me`: si `pendiente` es `null`, entra.

### Mi marca (configuración)

```
┌────────────────────────────────────────────┐
│  BebyRo                          [ logo ]  │
│  2 clientes · vendido $11.000              │
│  cobrado $2.000 · le deben $9.000          │
├────────────────────────────────────────────┤
│  Dueños                                    │
│   Ana   · 30111222              (vos)      │
│   Beto  · 28456789          [ Sacar ]      │
│  DNI [            ]   [ Sumar dueño ]      │
├────────────────────────────────────────────┤
│  [ Editar datos ]        [ Irme de la marca ] │
└────────────────────────────────────────────┘
```

### Checklist

**Onboarding**
- [ ] Después de login/registro, decidir la pantalla con `pendiente`
- [ ] Un 403 con `detalles.pendiente` en cualquier request manda al onboarding
- [ ] Perfil: teclado numérico, acepta puntos, avisar que no se cambia
- [ ] Marca: crear, o mostrar el DNI propio para que el socio lo sume
- [ ] "Ya me sumó" re-consulta `/auth/me`

**Mi marca**
- [ ] Estadísticas arriba, en pesos
- [ ] Lista de dueños; el propio marcado como "vos"
- [ ] Sumar por DNI, con los mensajes del backend (404 / 409)
- [ ] "Sacar" con confirmación; no mostrarlo si es el único dueño
- [ ] "Irme" con confirmación fuerte: "no te llevás nada"
- [ ] Editar datos y logo (cualquier dueño)

**Super admin**
- [ ] Listado de marcas con dueños y números, con buscador
- [ ] Corregir DNI desde la ficha del usuario

---

## Decisiones y límites

- **Los dueños no se guardan en la marca:** salen de los usuarios que apuntan a
  ella (`usuario.marca`). Una sola fuente de verdad, sin listas que se
  desincronicen.
- **El DNI es solo argentino** (7 u 8 números). Un documento extranjero no
  entra; se puede ampliar si hace falta.
- **Carrera rara:** si dos dueños se sacan mutuamente en el mismo instante, la
  marca podría quedar sin dueños. Con dos personas en un negocio no pasa; si
  pasara, lo resuelve el super_admin.
- **Las estadísticas se recalculan en cada cambio** sobre toda la marca. Para un
  negocio de barrio es instantáneo; con decenas de miles de tickets conviene
  pasarlas a un recálculo diferido.
- **Los datos anteriores se borraron** con `scripts/reiniciar-datos.mjs` (con
  respaldo en `respaldos/`): antes todo era de un usuario y no había forma
  limpia de repartirlo en marcas.

---

## Probarlo por consola

```bash
TOKEN=...   # POST /auth/login

curl -X PUT http://localhost:4000/auth/me/perfil \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"dni":"30.111.222"}'

curl -X POST http://localhost:4000/marcas \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nombre":"BebyRo"}'

curl -X POST http://localhost:4000/marcas/mia/duenos \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"dni":"28456789"}'

curl http://localhost:4000/marcas/mia -H "Authorization: Bearer $TOKEN"
```
