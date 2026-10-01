# Marcas — lo que falta en el front

Qué quedó sin hacer del checklist de [MARCAS.md](MARCAS.md) y de la parte de
la marca de [FACTURA_PDF.md](FACTURA_PDF.md). Revisado contra el código el
2026-09-11. El typecheck (`tsc --noEmit`) y el lint pasan, pero **nada de esto
se probó en el dispositivo**.

---

## Resumen

| # | Qué | Quién lo usa | Estado |
| --- | --- | --- | --- |
| 1 | Subir, cambiar y sacar el logo de la marca | Administrador (cualquier dueño) | ✅ Hecho · falta probar en el celular |
| 2 | Área propia del super_admin | super_admin | ❌ Sin empezar |
| 3 | Listado de marcas con buscador | super_admin | ❌ Sin empezar |
| 4 | Corregir el DNI de un usuario | super_admin | ❌ Sin empezar |
| 5 | `registradoPor` en los tickets | Administrador | ❌ Sin empezar |
| 6 | Compartir la factura: PDF, WhatsApp y mail | Administrador | ✅ Hecho · falta probar en el celular |
| 7 | Los dos colores de la marca (tiñen el PDF) | Administrador (cualquier dueño) | ✅ Hecho · falta probar en el celular |

---

## 1. El logo de la marca ✅

Hecho según [MARCAS.md](MARCAS.md#el-logo) y
[FACTURA_PDF.md](FACTURA_PDF.md#el-logo-uno-por-marca-y-punto).

| Pieza | Dónde |
| --- | --- |
| `puedeSubirLogo` en la marca (default `false`) y la firma | [schemas.ts](../src/features/marcas/schemas.ts) |
| `firmarLogo`, `guardarLogo`, `sacarLogo` | [marcasApi.ts](../src/features/marcas/api/marcasApi.ts) |
| Elegir la imagen y subirla a Cloudinary con la firma | [services/imagenes](../src/services/imagenes/imagenes.ts) |
| Los tres pasos, la vista previa y el sacar | [useLogoMarca.ts](../src/features/marcas/hooks/useLogoMarca.ts) |
| La tabla de `puedeSubirLogo` × `logoUrl` | [SeccionLogo.tsx](../src/features/marcas/components/SeccionLogo.tsx) |
| La imagen antes de guardar, con la barra de progreso | [VistaPreviaLogo.tsx](../src/features/marcas/components/VistaPreviaLogo.tsx) |

Del checklist de FACTURA_PDF.md: vista previa antes de guardar ✅, progreso
mientras sube ✅, solo png/jpg/webp ✅ (el selector del sistema no deja
filtrar: se chequea al volver y avisa), botón solo con `puedeSubirLogo` ✅.

### El logo en el alta de la marca

Decisión del 2026-09-14: el formulario de "Creá tu marca" **tiene el campo del
logo**, opcional.

- Se elige en el formulario, pero **se sube recién después de crear la marca**:
  las rutas del logo cuelgan de `/marcas/mia` y antes no existen. Tampoco se
  sabe antes si el server puede guardar logos (`puedeSubirLogo` llega con la
  marca creada).
- **Sin logo**: al tocar "Crear mi marca" sale "¿Seguir sin logo?", avisando
  que lo va a necesitar para generar las facturas. Puede elegirlo ahí o seguir.
- **Si el logo falla con la marca ya creada**: no se vuelve al formulario
  (crearla de nuevo daría 409). Se ofrece reintentar el logo o seguir sin él.
- Mi marca repite el aviso cuando no hay logo.

**"Sin logo no hay factura" se exige en el front** (punto 6): generar,
mandar por WhatsApp o por mail piden subir el logo primero. El backend
generaría el PDF igual sin logo.

### ⚠️ Antes de probarlo

- **Hace falta un development build nuevo** (`npx expo run:android`): se
  instaló `expo-image-picker`, que tiene código nativo. En el build que está
  instalado hoy el botón no rompe nada: avisa "actualizá la app".
- En `app.json` va el plugin con el texto del permiso de fotos de iOS, y con
  cámara y micrófono apagados (en Android el plugin los pide si no se dice lo
  contrario, y acá no se usan).

### Decisiones

- **Recorte libre, sin forzar cuadrado** (`allowsEditing` sin `aspect`): un
  logo apaisado no se corta. En Android el recorte es libre; **en iOS el
  recorte del sistema es siempre cuadrado**. Si eso molesta con logos
  apaisados, se apaga `allowsEditing` solo en iOS.
- **`sacarLogo` vuelve a pedir la marca** en vez de leer la respuesta, porque
  la doc no dice qué devuelve el `DELETE`. Si devuelve la marca, se puede
  escribir directo en la caché como hacen las otras.
- La subida a Cloudinary va con `XMLHttpRequest` y no con `fetch`: `fetch` no
  avisa cuánto lleva subido.
- **El logo se sube como viene y se muestra en WEBP, al tamaño de pantalla.**
  No se convierte en el teléfono (no hace falta ninguna librería): la app le
  pide a Cloudinary en la URL una variante `c_limit,w_…,h_…,f_webp,q_auto` del
  lado en que se muestra × 3 ([logo.ts](../src/features/marcas/logo.ts)). Así
  no baja el original de hasta 1000×1000 para un círculo de 64 puntos. El PDF y
  el mail no usan esa URL: el backend le pide a Cloudinary un PNG aparte
  (`c_limit,w_440,h_160,f_png`), porque pdfmake no lee WEBP.

---

## 2. Área propia del super_admin

El super_admin **no tiene marca ni `pendiente`**, y el backend le responde
`403` a todas las rutas del negocio.

Hoy igual cae en el área de administrador (dashboard, clientes, facturas), que
va a fallar entera:

- [rutas.ts](../src/features/auth/rutas.ts): `INICIO_POR_ROL.super_admin` apunta a `/admin`.
- [admin/_layout.tsx](../src/app/admin/_layout.tsx): `super_admin` está en
  `ROLES_PERMITIDOS` de forma temporal (el comentario explica por qué: sin eso,
  el guard lo rebota en un loop).

**Qué hacer:** armar su propia sección (por ejemplo `/super-admin`), cambiar
`INICIO_POR_ROL` y sacarlo de `ROLES_PERMITIDOS` **en el mismo cambio**. Ahí
adentro van los puntos 3 y 4. Con la regla del CLAUDE.md, cada pantalla lleva
su índice `useEsEscritorio()` con la vista de escritorio en `EnConstruccion`.

---

## 3. Listado de marcas (super_admin)

**Checklist:** "Listado de marcas con dueños y números, con buscador".

```
GET /marcas?buscar=&pagina=&porPagina=   (porPagina hasta 100)
→ { datos: Marca[], total, pagina, porPagina, paginas }
```

- Cada ítem tiene la misma forma que `GET /marcas/mia`, así que se reutiliza
  `marcaSchema`. Falta el schema de la respuesta paginada.
- Buscador por nombre (con debounce) y paginado o scroll infinito.
- Tarjeta con nombre, logo, dueños y las cuatro estadísticas.
- **Tirar para abajo para refrescar** con `useRefrescar` (regla 9).

---

## 4. Corregir el DNI de un usuario (super_admin)

**Checklist:** "Corregir DNI desde la ficha del usuario".

```
PUT /usuarios/:id/dni   { "dni": "30111223" }
409 → el DNI ya es de otra cuenta
```

- El DNI no lo cambia el usuario: solo el super_admin, por errores de carga.
- ⚠️ **No existe una ficha de usuario** en el front. Hay que definir desde
  dónde se llega: lo más directo es desde los dueños de una marca en el
  listado del punto 3.
- Se puede reutilizar [CampoDni.tsx](../src/features/marcas/components/CampoDni.tsx).
  Si lo usa una feature del super_admin, pasa a `shared/ui/atoms/` por la
  regla de promoción.
- Relacionado: `DELETE /usuarios/:id` responde `400` si es el único dueño de su
  marca. Si se agrega el borrado de usuarios, mostrar ese mensaje.

---

## 5. `registradoPor` en los tickets

**MARCAS.md:** "`registradoPor` en tickets y pagos dice cuál de los dueños lo
cargó".

- **Pagos:** ✅ ya se lee y se muestra ([pagos/formato.ts](../src/features/pagos/formato.ts)).
- **Tickets:** ❌ [tickets/schemas.ts](../src/features/tickets/schemas.ts) no
  lo lee, así que no se ve quién cargó cada ticket.

**Qué hacer:** sumarlo a `ticketSchema` igual que en pagos (puede venir como
id o poblado con el nombre) y mostrarlo en el renglón o el detalle del ticket
cuando la marca tiene más de un dueño.

---

## 6. Compartir la factura ✅

Hecho según [FACTURA_PDF.md](FACTURA_PDF.md), al final del detalle de la
factura ([EnviarFactura.tsx](../src/features/facturas/components/EnviarFactura.tsx),
[useEnviarFactura.ts](../src/features/facturas/hooks/useEnviarFactura.ts)):

| Botón | Qué hace |
| --- | --- |
| **Generar factura** | Baja el PDF (`GET /facturas/:id/pdf`) al caché y abre el **menú de compartir nativo de Android** (WhatsApp, Gmail, Drive…). En web: la hoja del navegador, o el PDF en otra pestaña |
| **WhatsApp** | `POST /facturas/:id/enlace` y abre `urlWhatsApp`. Si `telefonoWhatsApp` es `null`, avisa que va a elegir el contacto a mano |
| **Mail** | `POST /facturas/:id/enviar`, con el email del cliente precargado (se puede cambiar; no se guarda) y un mensaje opcional |
| **Dar de baja los links** | `DELETE /facturas/:id/enlace`, con confirmación |

- **Sin logo no se genera** (decisión del 2026-09-14): los tres botones piden
  subirlo y llevan a Mi marca. Solo si el server puede guardar logos
  (`puedeSubirLogo`): si no, no se traba a nadie. El backend la generaría igual
  sin logo: **la regla vive en el front**.
- En una factura anulada la sección no aparece. Mientras corre una acción, las
  otras esperan.
- El PDF no pasa por RTK Query: se baja con `expo-file-system`, con el token de
  `headersDeSesion()` (el mismo que usa el `baseApi`).
- El archivo se llama como lo nombra el backend (`factura-0012-ana-lopez.pdf`):
  es el nombre con que le llega al cliente.

⚠️ **Hace falta un development build nuevo**: `expo-file-system` y
`expo-sharing` tienen código nativo. En el build viejo "Generar factura" avisa
que hay que actualizar la app; WhatsApp y mail andan igual.

Queda afuera: el PDF de la cuenta abierta desde la ficha del cliente
(`/clientes/:id/factura-actual/pdf`). Desde la ficha ya se llega al detalle de
la factura, que tiene el botón.

⚠️ El ítem "Ofrecerla al registrarse, con 'Más tarde'" del checklist de
FACTURA_PDF.md **quedó viejo**: ahora la marca es obligatoria y se crea en la
bienvenida, sin "más tarde".

---

## 7. Los colores de la marca ✅

Hecho según [mescla.md](mescla.md#los-colores-de-la-marca): la marca elige
**dos colores** (`colorPrimario` y `colorSecundario`) y el PDF sale con ellos.

| Dónde | Qué hay |
| --- | --- |
| **Creá tu marca** | El selector al final del formulario, con una combinación ya elegida (Azul, no el violeta de la app: así nadie queda con los de la app por no tocarlo) y la vista previa |
| **Mi marca** | La sección "Colores" con la vista previa de cómo sale hoy, y "Cambiar" abre el selector. Ahí también está "Volver a los colores de la app" (manda `null`) |

- **Selector**: ocho combinaciones armadas (un toque) y, para quien tiene los
  colores de su marca, dos campos hex a mano con la muestra al lado. Acepta
  `#1e3a8a`, `1E3A8A` o `#abc`; se manda normalizado a `#rrggbb`.
- **La vista previa hace la misma cuenta que el backend**
  ([paleta.ts](../src/features/marcas/paleta.ts), copia de `src/pdf/paleta.ts`):
  un color muy claro se oscurece en el texto hasta leerse sobre blanco, y el
  bloque del saldo usa tintes del primario. **Si el backend cambia la cuenta,
  hay que cambiarla acá también.**
- **Los colores solo viajan cuando se eligen**: "Datos de la marca" manda los
  textos sin los colores (el backend los deja como están), y "Colores" manda
  los textos tal cual más los dos colores.
- Los hex de las combinaciones son **datos de la marca**, no colores de la app:
  viven en `paleta.ts`, no en el theme.

---

## Ya hecho (para no rehacerlo)

- Onboarding completo: `pendiente` en la sesión, redirección en
  `EntradaScreen` y `RutaProtegida`, 403 con `detalles.pendiente` atrapado en
  el middleware, pantallas `/bienvenida/perfil` y `/bienvenida/marca`, "Ya me
  sumó".
- Mi marca: estadísticas en pesos, refresco, dueños con "vos", sumar por DNI
  con los mensajes del backend, sacar con confirmación (oculto si es el único),
  irse con confirmación fuerte, editar nombre, dirección y teléfono, y el logo.
- Las rutas viejas `/auth/me/marca*` no quedaron en el código.
