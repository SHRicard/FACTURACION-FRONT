# Términos, privacidad y baja de cuenta

Todo lo que el front tiene que implementar para que la app pase la revisión de
Google Play, y qué queda para cargar a mano en Play Console.

El backend ya está listo y probado: documentos publicados, aceptación
versionada por usuario y borrado real de la cuenta con todos sus datos. Esta
guía es el contrato para consumirlo.

---

## Índice

1. [Lo que Google exige](#1-lo-que-google-exige)
2. [Los documentos legales](#2-los-documentos-legales)
3. [Aceptar los términos](#3-aceptar-los-términos)
4. [Eliminar la cuenta](#4-eliminar-la-cuenta)
5. [Pantallas a construir](#5-pantallas-a-construir)
6. [Referencia de endpoints](#6-referencia-de-endpoints)
7. [Checklist de Play Console](#7-checklist-de-play-console)
8. [Cuando cambie el texto legal](#8-cuando-cambie-el-texto-legal)

---

## 1. Lo que Google exige

Cuatro cosas, y ninguna es opcional:

| Requisito | Quién lo resuelve |
|---|---|
| Política de privacidad en una URL pública y activa | Backend: `/legal/privacidad` |
| Consentimiento afirmativo antes de crear la cuenta | **Front**: checkbox sin tildar |
| Borrar la cuenta desde adentro de la app | **Front** + `DELETE /auth/me/cuenta` |
| Pedir la baja desde la web, sin login | Backend: `/legal/eliminar-cuenta` |

Más el formulario de Seguridad de los datos, que se completa a mano en la
consola (punto 7).

---

## 2. Los documentos legales

Tres URLs públicas. No piden token.

```
GET /legal/terminos          → Términos y condiciones
GET /legal/privacidad        → Política de privacidad
GET /legal/eliminar-cuenta   → Cómo darse de baja
```

Devuelven **HTML** si las abre un navegador, y **JSON** si mandás
`Accept: application/json` o agregás `?formato=json`.

Para la app conviene el JSON: podés renderizar los documentos con tus propios
estilos en vez de meter un WebView, que en mobile se ve mal y no respeta el
tema de la app.

```jsonc
// GET /legal/terminos?formato=json
{
  "tipo": "terminos",
  "version": "2026-09-17",
  "titulo": "Términos y condiciones de Cuenta Corriente",
  "actualizadoEl": "2026-09-17",
  "contacto": "soporte@tudominio.com",
  "secciones": [
    { "titulo": "1. Aceptación", "contenido": "Al crear una cuenta o usar..." },
    { "titulo": "2. Servicio",   "contenido": "..." }
  ]
}
```

Renderizarlo es un `map`:

```jsx
const [doc, setDoc] = useState(null);

useEffect(() => {
  fetch(`${API}/legal/terminos?formato=json`)
    .then((r) => r.json())
    .then(setDoc);
}, []);

if (!doc) return <Cargando />;

return (
  <ScrollView>
    <Titulo>{doc.titulo}</Titulo>
    <Chico>Versión {doc.version}</Chico>
    {doc.secciones.map((s) => (
      <View key={s.titulo}>
        <Subtitulo>{s.titulo}</Subtitulo>
        <Parrafo>{s.contenido}</Parrafo>
      </View>
    ))}
  </ScrollView>
);
```

El mismo componente sirve para `/legal/privacidad`: cambia la URL y nada más.

---

## 3. Aceptar los términos

### Qué guarda el backend

En cada usuario, tres campos:

```ts
aceptoTerminosYCondiciones: boolean   // si aceptó
terminosYCondicionesVersion: string   // "2026-09-17", qué versión aceptó
terminosYCondicionesAceptadosEn: Date // cuándo
```

Se guarda la **versión**, no solo un sí. Eso es lo que permite que, cuando
cambie el texto, todos vuelvan a aceptar sin perder el registro de qué había
aceptado cada uno.

### En el registro

`POST /auth/registro` y `POST /auth/google` **exigen** el campo. Sin él
responden `400`:

```json
{
  "error": "Tenés que aceptar los términos y condiciones y la política de privacidad",
  "detalles": { "campo": "aceptoTerminosYCondiciones" }
}
```

El body correcto:

```json
{
  "nombre": "Ana",
  "email": "ana@ejemplo.com",
  "password": "secreto123",
  "aceptoTerminosYCondiciones": true
}
```

Con Google es igual, junto al `idToken`:

```json
{ "idToken": "...", "aceptoTerminosYCondiciones": true }
```

> **Esto Google lo mira.** El checkbox tiene que arrancar **sin tildar**, y los
> dos links —términos y privacidad— tienen que estar visibles al lado, no
> escondidos en un menú. Un checkbox tildado de fábrica, o un "al registrarte
> aceptás" sin casilla, es motivo de rechazo.

```jsx
const [acepto, setAcepto] = useState(false); // arranca en false, siempre

<Checkbox value={acepto} onChange={setAcepto}>
  Acepto los <Link a="/legal/terminos">términos y condiciones</Link> y la{" "}
  <Link a="/legal/privacidad">política de privacidad</Link>
</Checkbox>

<Boton disabled={!acepto} onPress={registrar}>Crear cuenta</Boton>
```

### En cuentas que ya existen

`GET /auth/me` devuelve un campo `pendiente` que dice qué pantalla mostrar:

```jsonc
{
  "usuario": { /* ... */ },
  "marca": null,
  "pendiente": "terminos"   // "terminos" | "perfil" | "marca" | null
}
```

El orden es siempre el mismo: **`terminos` → `perfil` → `marca` → `null`**.
Los términos van primero: hasta que no acepte, no hay onboarding.

Además, mientras esté pendiente, **toda** ruta de negocio corta con `403`:

```json
{
  "error": "Aceptá los términos y condiciones antes de empezar",
  "detalles": { "pendiente": "terminos" }
}
```

Conviene atajarlo en el interceptor de tu cliente HTTP, así no hay que
manejarlo pantalla por pantalla:

```js
if (res.status === 403 && cuerpo?.detalles?.pendiente) {
  navegar(PANTALLA_POR_PENDIENTE[cuerpo.detalles.pendiente]);
  return;
}
```

`respuestaSesion` (lo que devuelven registro, login y Google) también trae
`pendiente`, así que después de loguearte ya sabés a dónde ir sin pedir
`/auth/me` de nuevo:

```json
{ "token": "eyJ...", "usuario": { }, "pendiente": "terminos" }
```

### Aceptar

```http
POST /auth/me/terminos
Authorization: Bearer <token>
Content-Type: application/json

{ "aceptoTerminosYCondiciones": true }
```

Devuelve `200` con el usuario actualizado y el nuevo `pendiente`:

```json
{ "usuario": { "aceptoTerminosYCondiciones": true, "terminosYCondicionesVersion": "2026-09-17" },
  "pendiente": "perfil" }
```

Un `false` responde `400`: no existe "aceptar que no acepto". Si la persona no
acepta, la única salida es cerrar sesión o eliminar la cuenta.

---

## 4. Eliminar la cuenta

```http
DELETE /auth/me/cuenta
Authorization: Bearer <token>
Content-Type: application/json

{ "confirmacion": "ELIMINAR" }
```

La palabra literal `ELIMINAR` es obligatoria: sin ella responde `400`. Es para
que un toque accidental no borre un negocio entero. El front puede pedir que la
escriba o mandarla él desde un diálogo de confirmación en dos pasos — lo que no
puede es borrar con un solo toque.

Respuesta:

```json
{
  "mensaje": "Cuenta eliminada",
  "usuarioEliminado": true,
  "marcaEliminada": true,
  "datosDelNegocioEliminados": true
}
```

Después de esto el token queda muerto: cualquier request responde `401`. El
front tiene que limpiar el almacenamiento local y volver al login.

### Qué se borra, exactamente

Depende de si la persona compartía su marca. **Mostrale cuál de los dos casos
es el suyo antes de confirmar**, porque no son lo mismo:

**Es la única dueña** → se va todo:

- su cuenta: nombre, correo, DNI, foto, vínculo con Google
- la marca y su logo
- clientes, productos, especies, tickets, facturas y pagos

**La marca tiene otros dueños** → el negocio es de ellos y queda intacto:

- se borra solo su cuenta
- su nombre desaparece de los tickets y pagos que había registrado
- si era quien creó la marca, esa referencia pasa a otro dueño

Para saber en qué caso está, mirá los dueños de la marca (`GET /auth/me`
devuelve `marca` con sus `duenos`): si hay uno solo, es el primer caso.

`marcaEliminada` y `datosDelNegocioEliminados` en la respuesta confirman qué
pasó de verdad.

> No se puede deshacer y no hay período de gracia. El diálogo tiene que
> decirlo con todas las letras.

### La página web de baja

`GET /legal/eliminar-cuenta` es el "recurso web externo" que Google exige
además del borrado dentro de la app: una URL que abra **sin estar logueado**,
para quien perdió el acceso a su cuenta. Ya está hecha y explica los dos
caminos. Esa URL es la que se carga en Play Console (punto 7).

---

## 5. Pantallas a construir

**1. Registro** — checkbox sin tildar + los dos links. El botón de crear cuenta
deshabilitado hasta que lo marque.

**2. Documento legal** — una sola pantalla parametrizada que lea el JSON de
`/legal/terminos` o `/legal/privacidad`. La abren el registro, el perfil y la
pantalla de aceptación.

**3. Aceptación** — la que aparece cuando `pendiente === "terminos"`. Muestra el
texto, un botón "Acepto" que llama a `POST /auth/me/terminos`, y una salida
("Ahora no") que cierra sesión. No se puede saltear.

**4. Perfil → sección Legal** — links a términos y privacidad. Google pide que
sean accesibles desde adentro de la app, no solo en el registro.

**5. Perfil → Eliminar mi cuenta** — en rojo, al final. Abre el diálogo que
explica qué se borra según el caso, pide la confirmación, llama al endpoint,
limpia la sesión y vuelve al login.

---

## 6. Referencia de endpoints

| Método | Ruta | Auth | Body | Devuelve |
|---|---|---|---|---|
| `GET` | `/legal/terminos` | — | — | HTML o JSON del documento |
| `GET` | `/legal/privacidad` | — | — | HTML o JSON del documento |
| `GET` | `/legal/eliminar-cuenta` | — | — | HTML o JSON con los pasos de baja |
| `POST` | `/auth/registro` | — | `{ nombre, email, password, aceptoTerminosYCondiciones: true }` | `{ token, usuario, pendiente }` |
| `POST` | `/auth/google` | — | `{ idToken, aceptoTerminosYCondiciones: true }` | `{ token, usuario, pendiente, caso }` |
| `GET` | `/auth/me` | Bearer | — | `{ usuario, marca, pendiente }` |
| `POST` | `/auth/me/terminos` | Bearer | `{ aceptoTerminosYCondiciones: true }` | `{ usuario, pendiente }` |
| `DELETE` | `/auth/me/cuenta` | Bearer | `{ confirmacion: "ELIMINAR" }` | `{ mensaje, usuarioEliminado, marcaEliminada, datosDelNegocioEliminados }` |

**Forma de los errores**, igual en toda la API:

```json
{ "error": "mensaje para mostrar", "detalles": { "campo": "...", "pendiente": "..." } }
```

| Código | Cuándo | Qué hacer |
|---|---|---|
| `400` | falta aceptar, o falta la palabra `ELIMINAR` | mostrar `error`, marcar `detalles.campo` |
| `401` | token vencido, o la cuenta ya no existe | limpiar sesión, ir al login |
| `403` + `detalles.pendiente` | falta un paso del onboarding | ir a la pantalla de ese paso |

---

## 7. Checklist de Play Console

Esto no es código, va a mano en la consola. Las URLs salen de `API_PUBLIC_URL`,
que en producción **tiene que ser HTTPS**.

- [ ] Backend desplegado con HTTPS y `API_PUBLIC_URL` apuntando ahí.
- [ ] `LEGAL_CONTACT_EMAIL` con un correo real y atendido. Sin esta variable
      los documentos salen con un contacto de ejemplo y un aviso visible
      adentro de la política de privacidad — Google lo lee.
- [ ] `APP_NAME` con el nombre que va a tener la app en la ficha.
- [ ] Abrir las tres URLs de `/legal` en el navegador y confirmar que cargan
      sin error ni redirecciones. Google las verifica sola.
- [ ] **Ficha de Play Store → Política de privacidad**:
      `https://tu-api/legal/privacidad`
- [ ] **Contenido de la app → Seguridad de los datos**: declarar lo que la app
      recolecta de verdad — nombre, correo, DNI, foto de perfil si entra con
      Google, y los datos de negocio que carga la persona usuaria (incluidos
      nombres y teléfonos de sus clientes). Marcar cifrado en tránsito y que
      los datos se pueden eliminar. No se venden ni se usan para publicidad.
- [ ] En ese mismo formulario, la pregunta de eliminación de cuenta: responder
      que la app ofrece borrado **dentro de la app** y cargar
      `https://tu-api/legal/eliminar-cuenta` como recurso web.
- [ ] Cuenta de prueba para el revisor, si el registro no es libre.

> Aunque no te interesen los datos de nadie, la app **sí** recolecta DNI,
> correos y teléfonos de terceros, y eso hay que declararlo tal cual. Lo que
> diga el formulario de Seguridad de los datos tiene que coincidir con lo que
> dice la política de privacidad: cuando no coinciden, es el motivo de rechazo
> más común.

---

## 8. Cuando cambie el texto legal

En el backend, tres pasos:

1. Editar las secciones en `src/legal/documentos.ts`.
2. Subir `VERSION_DOCUMENTOS_LEGALES` a la fecha del cambio.
3. Desplegar.

Todas las cuentas pasan solas a `pendiente: "terminos"` y vuelven a aceptar la
próxima vez que entren. **El front no toca nada**: si implementaste la pantalla
de aceptación del punto 3, ya funciona.

---

Esto cubre lo que Play Console revisa y describe lo que la app hace de verdad,
pero no es asesoramiento legal ni reemplaza la revisión de un profesional si el
negocio crece o sale de Argentina.
