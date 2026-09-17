# La factura en PDF

El usuario le manda a su cliente una copia de la factura en PDF, **con su
marca**: su nombre y su logo, no los de la app. Hay tres caminos:

| Camino | Cómo le llega al cliente |
| --- | --- |
| **Compartir desde la app** | La app descarga el PDF y abre el menú de compartir del celular (WhatsApp, lo que sea) |
| **Link por WhatsApp** | Un link que el cliente abre sin loguearse; el mensaje ya viene escrito |
| **Mail** | Le llega al mail, con el PDF adjunto |

- **Base:** `http://localhost:4000`
- **Auth:** pide `Authorization: Bearer <token>`, salvo el link público
- **Errores:** siempre `{ error, detalles? }`, salvo el link público (HTML)

---

## No hace falta ningún storage

**El PDF no se sube ni se guarda en ningún lado.** Se arma en memoria cada vez
que alguien lo pide (unos 40–70 KB, en milisegundos) y se manda en la misma
respuesta:

```
App      GET /facturas/:id/pdf ──► se arma ──► vuelve el archivo ──► el celular lo comparte
Mail     POST /facturas/:id/enviar ──► se arma ──► va adjunto al mail
Link     el cliente abre el link ──► la API lo arma en ese momento ──► lo ve en el navegador
```

El link **no apunta a un archivo**: apunta a la API con un token firmado. Por
eso muestra siempre los datos del momento en que se abre: si el cliente pagó
algo después de recibirlo, el saldo ya viene descontado.

Lo único que se guarda afuera es **el logo de la marca**, en Cloudinary (ver
abajo). Es una imagen por marca, no un archivo por factura.

---

## Paso 0: la marca

**El PDF sale con la marca dueña de la factura**: su nombre (grande), su
dirección, su teléfono y su logo. La marca es obligatoria —sin ella no se
opera— y la comparten todos sus dueños. Cómo se crea, se edita y se suman
dueños está en **[MARCAS.md](MARCAS.md)**.

La marca se busca **por la factura**, no por quién está logueado: así el link
público, que abre el cliente sin login, sale igual que el PDF que baja un dueño.

### El logo: uno por marca, y punto

**Cada marca tiene UN logo.** Se puede cambiar todas las veces que quieran,
pero nunca hay dos: el archivo en Cloudinary se llama siempre
`marcas/<id de la marca>/logo`, y cambiar el logo **pisa** al anterior en vez
de sumar otro. Así Cloudinary no se llena de logos viejos:

| Pasa esto | En Cloudinary queda |
| --- | --- |
| Suben el primer logo | 1 archivo |
| Lo cambian 10 veces, cualquiera de los dueños | 1 archivo (el último) |
| Suben uno y la app se cierra antes del paso 3 | 1 archivo (lo pisa la próxima subida) |
| Sacan el logo | 0 |

Además, Cloudinary lo guarda achicado a 1000×1000 como máximo: aunque suban
una foto de 12 MP, cada logo ocupa poco.

El archivo **va directo de la app a Cloudinary**, sin pasar por nuestro
server. El backend solo firma la subida (el secreto de Cloudinary nunca sale de
ahí) y después guarda la URL en la marca.

**Antes de mostrar el botón**, mirar `puedeSubirLogo` en la marca: es `true`
cuando el server tiene Cloudinary configurado (ver
[MARCAS.md](MARCAS.md#el-logo)). Con `false`, la firma respondería `503`.

```
1. POST /marcas/mia/logo/firma                 → { urlSubida, campos }
2. POST <urlSubida>  (FormData: file + campos) → Cloudinary responde { version, … }
3. PUT  /marcas/mia/logo  { version }          → la marca
```

**Paso 1** — la firma vale una hora y fija todo: el nombre del archivo (el de
esa marca), que pise al anterior, los formatos (`png`, `jpg`, `jpeg` o
`webp`; SVG no) y el tamaño máximo. Con ella solo se puede reemplazar el logo
de esa marca:

```jsonc
{
  "urlSubida": "https://api.cloudinary.com/v1_1/<cloud>/image/upload",
  "campos": {
    "allowed_formats": "png,jpg,jpeg,webp",
    "invalidate": "true",
    "overwrite": "true",
    "public_id": "marcas/6aa3…/logo",
    "timestamp": 1789073112,
    "transformation": "c_limit,w_1000,h_1000",
    "api_key": "1234567890",
    "signature": "b1f4…"
  }
}
```

**Paso 2** — a Cloudinary se le manda un `FormData` con el archivo en `file` y
**todos los `campos` tal cual**. Si se cambia o se saca uno, la firma no
coincide y Cloudinary rechaza la subida.

**Paso 3** — solo la `version` que devolvió Cloudinary:

```jsonc
{ "version": 1789073112 }
```

El backend arma la URL él mismo (no la acepta del front) y chequea que el logo
exista de verdad en Cloudinary antes de guardarlo. La versión va en la URL
para que, al cambiar el logo, nadie siga viendo el viejo desde una caché.

**`DELETE /marcas/mia/logo`** lo saca de la marca y lo borra de Cloudinary.

### Errores del logo

| Caso | Status | `error` |
| --- | --- | --- |
| Cloudinary sin configurar en el server | 503 | `La subida de logos no está configurada en el servidor` |
| `version` ausente o inválida | 400 | `Falta la versión del logo: es el campo "version" que devuelve Cloudinary al subirlo` |
| El logo no está en Cloudinary | 400 | `No encontramos el logo en Cloudinary. Probá subirlo de nuevo.` |
| Más de 30 firmas por hora | 429 | `Demasiados intentos…` |

---

## Los endpoints de la factura

| Método | Ruta | Para qué |
| --- | --- | --- |
| `GET` | `/facturas/:id/pdf` | El PDF de una factura puntual |
| `GET` | `/clientes/:id/factura-actual/pdf` | El PDF de la cuenta abierta del cliente |
| `POST` | `/facturas/:id/enviar` | Mandarla por mail |
| `POST` | `/facturas/:id/enlace` | Generar el link público y el mensaje de WhatsApp |
| `DELETE` | `/facturas/:id/enlace` | Dar de baja todos los links mandados de esa factura |
| `GET` | `/publico/facturas/:token` | **Sin login.** Lo que abre el cliente |

Todas las de arriba (menos la pública) solo encuentran facturas **del usuario
logueado**: una factura de otro responde `404`.

### GET /facturas/:id/pdf · GET /clientes/:id/factura-actual/pdf

Devuelven el archivo, `application/pdf`:

```
Content-Disposition: attachment; filename="factura-0001-rosa-perez.pdf"
Cache-Control: private, no-store
```

| Factura | Nombre del archivo |
| --- | --- |
| Cerrada o pagada | `factura-0012-ana-lopez.pdf` |
| Abierta | `factura-en-curso-ana-lopez-2026-09-10.pdf` |

Con `?inline=1` vuelve `inline` en vez de `attachment`: el navegador lo muestra
en vez de descargarlo. Sirve para una vista previa en la web.

`factura-actual/pdf` pone la cuenta al día igual que `factura-actual`: si la
abierta venció, la cierra y el PDF sale de la abierta nueva. Para mandar una
factura puntual (la que se acaba de cerrar) usá `/facturas/:id/pdf`.

**Lo anulado no aparece.** Los tickets y pagos anulados se ven tachados en la
app, pero al cliente no se le mandan.

### POST /facturas/:id/enviar

```jsonc
{
  "email": "rosa@mail.com",          // opcional: si no va, usa el del cliente
  "mensaje": "Cualquier cosa avisame" // opcional, hasta 500 caracteres
}
```

El `email` del body **no se guarda** en el cliente: para eso está
`PUT /clientes/:id`.

```jsonc
// 200
{ "enviado": true, "para": "rosa@mail.com", "asunto": "Tienda Rosa · Factura N° 0001",
  "archivo": "factura-0001-rosa-perez.pdf" }
```

El mail sale **con la marca**: su logo arriba (o su nombre, si no
tiene logo), el saldo y el vencimiento, el mensaje si lo hay, y el PDF
adjunto. **Si el cliente responde, le llega al usuario**, no a la app: el mail
va con `Reply-To` al email de la cuenta.

| Caso | Status | `error` |
| --- | --- | --- |
| El cliente no tiene email y no vino uno | 400 | `Este cliente no tiene email cargado. Cargáselo o escribí uno para mandarlo.` + `detalles: { campo: "email" }` |
| Email mal escrito | 400 | `El email no tiene un formato válido` |
| Mensaje de más de 500 | 400 | `El mensaje puede tener hasta 500 caracteres` |
| Factura anulada | 400 | `No se puede enviar una factura anulada` |
| El server no tiene mail configurado | 503 | `El envío de mails no está configurado en el servidor` |
| Falló el envío | 502 | `No se pudo enviar el mail. Probá de nuevo o compartila por WhatsApp.` + `detalles: { motivo }` |
| Más de 20 por hora | 429 | `Demasiados intentos…` |

### POST /facturas/:id/enlace

```jsonc
{ "diasValidez": 7 }   // opcional, entero de 1 a 30. Default 7
```

```jsonc
// 200 — respuesta real
{
  "url": "http://localhost:4000/publico/facturas/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2Ijow…",
  "venceEl": "2026-09-17T20:45:12.000Z",
  "diasValidez": 7,
  "textoWhatsApp": "Hola Rosa! Te paso el detalle de tu cuenta en Tienda Rosa (Período en curso): debés $ 28.000, vence el 10/09/2026.\nLo podés ver acá: http://localhost:4000/publico/facturas/eyJ…\nEl link vale hasta el 17/09/2026.",
  "urlWhatsApp": "https://wa.me/5491122334455?text=Hola%20Rosa!%20Te%20paso…",
  "telefonoWhatsApp": "5491122334455"
}
```

**Para mandarlo alcanza con abrir `urlWhatsApp`**: abre WhatsApp con el chat
del cliente y el mensaje escrito; el usuario solo toca enviar.

- El teléfono se normaliza al formato de WhatsApp: `011 15 5555-1234`,
  `+54 9 11 5555-1234` y `11 5555 1234` dan todos `5491155551234`.
- **Si el cliente no tiene teléfono** (o no se entiende), no es un error:
  `telefonoWhatsApp` viene `null` y `urlWhatsApp` abre WhatsApp para elegir el
  contacto a mano.
- Si está al día, el mensaje dice "estás al día" en vez del saldo.

Se pueden generar todos los links que quieras: generar uno nuevo **no** mata
los anteriores.

| Caso | Status | `error` |
| --- | --- | --- |
| `diasValidez` fuera de 1–30 o no entero | 400 | `Los días de validez tienen que ser un número entero entre 1 y 30` |
| Factura anulada | 400 | `No se puede compartir una factura anulada` |
| Producción sin `API_PUBLIC_URL` | 503 | `Falta configurar API_PUBLIC_URL en el servidor` |

### DELETE /facturas/:id/enlace

Da de baja **todos** los links que se mandaron de esa factura: dejan de abrir
al toque. Los que se generen después andan normal.

```jsonc
{ "mensaje": "Listo: los links que mandaste de esta factura ya no abren.", "versionEnlace": 1 }
```

### GET /publico/facturas/:token — lo que abre el cliente

Sin login. Devuelve el PDF `inline`, así el celular lo muestra directo.

- **Datos del momento**, no de cuando se mandó.
- Si el link está roto, vencido o dado de baja, o la factura se anuló, el
  cliente ve una página simple: *"Este link ya no está disponible. Venció o el
  negocio lo dio de baja. Pedile que te mande uno nuevo."* Es la misma página
  para todos los casos, a propósito: así no se puede averiguar qué facturas
  existen probando links.
- Máximo 30 aperturas cada 15 minutos por IP.

---

## Qué va en el PDF

Diseño **"resumen de cuenta"**: primero lo que el cliente quiere saber —cuánto
debe y para cuándo—, abajo la libreta con el saldo acumulado.

```
┌────────────────────────────────────────────────────────┐
│ Tienda Rosa                                   [logo]   │  ← la marca
│ Av. Siempreviva 742 · Tel. 11 4444-5555                │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Rosa Perez                         SALDO A PAGAR    │ │
│ │ DNI 28456789 · Tel. 1122334455        $ 66.500      │ │
│ │ Factura N° 0001 · cerrada el 06/09   [VENCIÓ HACE 5]│ │
│ │ ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │ Pagaste $ 20.000 de los $ 86.500 anotados · 23 %    │ │
│ └────────────────────────────────────────────────────┘ │
│ MOVIMIENTOS DEL PERÍODO                                │
│ Fecha  Movimiento                  Suma   Resta  Saldo │
│ 06/09  2 × Pantalón cargo · T. 14  28.000        28.000│
│ Compra                                                 │
│ 06/09  Pago a cuenta · Efectivo          −20.000 66.500│
│ ────────────────────────────────────────────────────── │
│        Saldo a pagar               86.500 −20.000 66.500│
├────────────────────────────────────────────────────────┤
│ Generado el …    Documento no válido como factura  1/1 │
└────────────────────────────────────────────────────────┘
```

- **Encabezado:** nombre, dirección y teléfono de la marca, y su logo si tiene.
- **El bloque del saldo:** el cliente, qué factura es ("Factura N° 0012" o
  "Período en curso"), el saldo en grande, un rótulo de estado (vence, venció
  hace N días, al día, pagada) y la barra de lo que ya pagó.
- **Movimientos:** compras y pagos mezclados por fecha, con el saldo como iba
  quedando. Cada compra lista sus ítems; si dejó algo en el momento, lo dice.
- **Muchas compras:** corta en varias páginas y repite el encabezado de la tabla.
- **Pie:** fecha de generación, "Documento no válido como factura" y el número
  de página. **Sin el nombre de la app**: el PDF es del usuario.
- **Anulada:** marca de agua "ANULADA" (solo se puede ver con login).

---

## El servicio en el front (Expo)

> **El `request()` de `client.ts` no sirve para el PDF**: siempre hace
> `JSON.parse` de la respuesta. El PDF se baja directo a un archivo.

```ts
// src/api/facturaPdf.service.ts
import * as FileSystem from "expo-file-system/legacy"; // en SDKs viejos: "expo-file-system"
import * as Sharing from "expo-sharing";
import { Linking } from "react-native";
import { request, API_URL, obtenerToken } from "./client";

export interface EnlaceFactura {
  url: string;
  venceEl: string;
  diasValidez: number;
  textoWhatsApp: string;
  /** Abre WhatsApp con el mensaje escrito. */
  urlWhatsApp: string;
  /** null = el cliente no tiene un celular que se entienda. */
  telefonoWhatsApp: string | null;
}

export const facturaPdfService = {
  /** Baja el PDF y abre el menú de compartir del celular. */
  async compartir(facturaId: string) {
    const token = await obtenerToken();
    const destino = `${FileSystem.cacheDirectory}factura-${facturaId}.pdf`;

    const { status, uri } = await FileSystem.downloadAsync(
      `${API_URL}/facturas/${facturaId}/pdf`,
      destino,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (status !== 200) throw new Error("No se pudo armar el PDF");

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: "Mandar la factura",
    });
  },

  /** Arma el link y abre WhatsApp con el mensaje listo. */
  async porWhatsApp(facturaId: string, diasValidez?: number) {
    const enlace = await request<EnlaceFactura>(`/facturas/${facturaId}/enlace`, {
      method: "POST",
      body: diasValidez ? { diasValidez } : {},
    });
    await Linking.openURL(enlace.urlWhatsApp);
    return enlace;
  },

  enviarPorMail(facturaId: string, datos: { email?: string; mensaje?: string } = {}) {
    return request<{ enviado: true; para: string; asunto: string; archivo: string }>(
      `/facturas/${facturaId}/enviar`,
      { method: "POST", body: datos }
    );
  },

  darDeBajaLinks(facturaId: string) {
    return request<{ mensaje: string }>(`/facturas/${facturaId}/enlace`, { method: "DELETE" });
  },
};
```

### Subir el logo

```ts
// src/api/marca.service.ts
import * as ImagePicker from "expo-image-picker";
import { request } from "./client";

interface FirmaLogo {
  urlSubida: string;
  campos: Record<string, string | number>;
}

export async function elegirYSubirLogo() {
  const elegido = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.9,
  });
  if (elegido.canceled) return null;
  const imagen = elegido.assets[0];

  // 1. La firma
  const firma = await request<FirmaLogo>("/marcas/mia/logo/firma", { method: "POST" });

  // 2. Directo a Cloudinary: el archivo + TODOS los campos tal cual
  const form = new FormData();
  form.append("file", {
    uri: imagen.uri,
    name: imagen.fileName ?? "logo.png",
    type: imagen.mimeType ?? "image/png",
  } as unknown as Blob);
  for (const [clave, valor] of Object.entries(firma.campos)) form.append(clave, String(valor));

  const subida = await fetch(firma.urlSubida, { method: "POST", body: form }).then((r) => r.json());
  if (subida.error) throw new Error(subida.error.message);

  // 3. Guardarlo en la marca: alcanza con la versión. Devuelve la marca.
  return request<{ logoUrl?: string; puedeSubirLogo: boolean }>("/marcas/mia/logo", {
    method: "PUT",
    body: { version: subida.version },
  });
}
```

---

## Las pantallas

### Mi marca

```
┌────────────────────────────────────────────┐
│  Mi marca                                  │
│  Así te ven tus clientes en la factura.    │
├────────────────────────────────────────────┤
│         ┌──────────┐                       │
│         │  [logo]  │   [ Cambiar logo ]    │
│         └──────────┘   Sacar logo          │
│  Nombre     [ Tienda Rosa              ]   │
│  Dirección  [ Av. Siempreviva 742      ]   │
│  Teléfono   [ 11 4444-5555             ]   │
├────────────────────────────────────────────┤
│              [ Guardar ]                   │
└────────────────────────────────────────────┘
```

### En la factura

```
┌────────────────────────────────────────────┐
│  Factura N° 0001 · Rosa Perez    $ 66.500  │
│  …                                         │
│  [ Compartir PDF ]  [ WhatsApp ]  [ Mail ] │
└────────────────────────────────────────────┘
```

### Checklist

**Marca**
- [ ] Ofrecerla al registrarse, con "Más tarde"
- [ ] Vista previa del logo antes de guardar
- [ ] Mostrar el progreso mientras sube a Cloudinary
- [ ] Solo png/jpg/webp: filtrarlo en el selector
- [ ] Mostrar el botón de logo solo si la marca trae `puedeSubirLogo: true`

**Factura**
- [ ] "Compartir PDF": bajar y abrir el menú de compartir
- [ ] "WhatsApp": generar el link y abrir `urlWhatsApp`
- [ ] Si `telefonoWhatsApp` es `null`, avisar que va a tener que elegir el contacto
- [ ] "Mail": si el cliente no tiene email, pedir uno en el momento
- [ ] Campo opcional de mensaje para el mail
- [ ] Bloquear los botones mientras va el request
- [ ] "Dar de baja links" en un menú secundario, con confirmación
- [ ] No mostrar las acciones en una factura anulada

---

## Variables de entorno

| Variable | Para qué |
| --- | --- |
| `API_PUBLIC_URL` | URL pública **de la API**, base del link que abre el cliente. Con Expo en un celular en desarrollo: la IP de la máquina en la red (`http://192.168.0.10:4000`). En producción es obligatoria |
| `ENLACES_SECRET` | Opcional. Clave de los links; sin ella se deriva de `JWT_SECRET`. Cambiarla invalida todos los links |
| `CLOUDINARY_URL` | `cloudinary://<api_key>:<api_secret>@<cloud_name>`. O las tres sueltas: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Sin ellas, subir logo da 503 y el PDF sale sin logo |

---

## Decisiones y límites

- **Nada se guarda:** ni PDFs ni copias. Cada pedido arma uno nuevo con los datos al día.
- **El logo se trae de Cloudinary en PNG** (Cloudinary lo convierte, sea cual sea
  el formato con que se subió) y queda en memoria. Si Cloudinary no responde,
  el PDF sale igual, sin logo.
- **Los colores del PDF son fijos** (la paleta violeta). Solo el nombre y el
  logo son de cada marca. Si hace falta, se puede sumar un color de marca.
- **Los mails de la cuenta** (bienvenida, contraseña) siguen como estaban. Solo
  el mail de la factura sale con la marca.
- **El link lleva un token largo** (~220 caracteres): en WhatsApp se ve como un
  link más. En el log del server se guarda cortado.
- **Rate limit por IP, en memoria.** Detrás de un proxy, todos los pedidos
  comparten IP y contador hasta que se configure `trust proxy`.
- **No es un comprobante fiscal:** el pie lo dice.

---

## Probarlo por consola

```bash
TOKEN=...        # el que devuelve POST /auth/login
FACTURA=6a9d8e19759da15f312a2dd7
CLIENTE=6a9d8e19759da15f312a2dd5

# la marca
curl -X PUT http://localhost:4000/marcas/mia \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"nombre":"Tienda Rosa","direccion":"Av. Siempreviva 742","telefono":"11 4444-5555"}'

# bajar el PDF
curl http://localhost:4000/facturas/$FACTURA/pdf -H "Authorization: Bearer $TOKEN" -o factura.pdf
curl http://localhost:4000/clientes/$CLIENTE/factura-actual/pdf -H "Authorization: Bearer $TOKEN" -o actual.pdf

# el link y el mensaje de WhatsApp
curl -X POST http://localhost:4000/facturas/$FACTURA/enlace \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}'

# por mail
curl -X POST http://localhost:4000/facturas/$FACTURA/enviar \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"rosa@mail.com","mensaje":"Cualquier cosa avisame"}'
```
