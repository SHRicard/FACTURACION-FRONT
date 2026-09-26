# Avisos y notificaciones push

El super_admin escribe un aviso (un **mantenimiento**, una **funcionalidad
nueva**, una **versión nueva**) y **le llega como notificación a todos los que
tienen la app instalada**, hayan iniciado sesión o no. El aviso además queda
en una pantalla de avisos dentro de la app, para el que no tiene las
notificaciones activadas o quiere leerlo completo.

Este documento es **todo** lo que hace falta para implementarlo en el front:
la configuración, la parte de la app y la parte del panel del super_admin.

- **Base:** `http://localhost:4000`
- **Errores:** siempre `{ error, codigo?, detalles? }` → se leen con `interpretarError(fallo)` (sección 8)
- **Servicio de push:** Expo (el back llama a `exp.host`; no hay Firebase en el back)

```
             super_admin                               back                          teléfonos
  ┌────────────────────────────┐   POST /admin/avisos   ┌─────────┐   Expo → FCM/APNs   ┌──────────┐
  │ Título · Mensaje · Tipo    │ ─────────────────────► │  aviso  │ ──────────────────► │ 🔔 Aviso │
  │ [Enviar prueba] [Enviar]   │ ◄── 202 enviando ───── │ de a 100│                     └────┬─────┘
  └────────────────────────────┘                        └─────────┘                          │ toca
                                                             ▲                               ▼
          la app al abrir:  POST /app/dispositivos  ─────────┘          GET /app/avisos  (lista)
```

---

## Índice

1. [Qué tiene que hacer el front](#1-qué-tiene-que-hacer-el-front)
2. [Qué hace el back solo](#2-qué-hace-el-back-solo)
3. [Configuración única (Expo, Firebase, EAS)](#3-configuración-única-expo-firebase-eas)
4. [App: registrar el teléfono](#4-app-registrar-el-teléfono)
5. [App: mostrar y abrir las notificaciones](#5-app-mostrar-y-abrir-las-notificaciones)
6. [App: la pantalla de avisos](#6-app-la-pantalla-de-avisos)
7. [Panel super_admin: mandar avisos](#7-panel-super_admin-mandar-avisos)
8. [Errores](#8-errores)
9. [Qué significa cada número del envío](#9-qué-significa-cada-número-del-envío)
10. [Tipos TypeScript y esquemas zod](#10-tipos-typescript-y-esquemas-zod)
11. [Cómo probarlo y problemas comunes](#11-cómo-probarlo-y-problemas-comunes)
12. [Tabla de endpoints](#12-tabla-de-endpoints)

---

## 1. Qué tiene que hacer el front

**Configuración (una vez)** — sección 3
- [ ] Instalar `expo-notifications` y sumar su plugin en `app.json`
- [ ] `eas init` para tener `extra.eas.projectId`
- [ ] Firebase: `google-services.json` en la app + clave FCM V1 subida a EAS
- [ ] Ícono de notificación de Android (blanco sobre transparente)
- [ ] Generar una build nueva (Expo Go no sirve en Android)

**App (todos los usuarios)** — secciones 4 a 6
- [ ] `features/notificaciones/`: API, obtener el token, registrar el teléfono
- [ ] Crear el canal de Android `avisos` antes de pedir el permiso
- [ ] Mostrar las notificaciones con la app abierta (`setNotificationHandler`)
- [ ] Al tocar una notificación: abrir `/avisos` (o la tienda si es una versión nueva)
- [ ] Pantalla `/avisos`, accesible **con o sin sesión**
- [ ] Sumar `'Aviso'` a `TAGS_API`

**Panel del super_admin** — sección 7
- [ ] `features/super-admin/api/avisosApi.ts` con los endpoints de `/admin/avisos`
- [ ] Pantallas: historial, nuevo aviso (con prueba y confirmación), detalle con el avance
- [ ] Sumar **Avisos** al menú del panel
- [ ] Sumar `'AdminAviso'` a `TAGS_API`

---

## 2. Qué hace el back solo

Para que el front no lo repita ni lo espere de otro lado:

| El back… | Detalle |
| --- | --- |
| **Guarda un teléfono por token** | Con sesión queda asociado a la cuenta; sin sesión, anónimo. Los dos reciben los avisos |
| **Manda en segundo plano** | `POST /admin/avisos` responde `202` al instante; el envío sigue de a 100 teléfonos |
| **Deja afuera a las cuentas suspendidas** | Sus teléfonos no reciben avisos |
| **Frena el doble clic** | El mismo título y mensaje dos veces en 10 minutos → `409 AVISO_REPETIDO` |
| **Retoma si se reinicia** | Si el server se apaga a mitad de un envío (un deploy), al arrancar sigue desde donde quedó, sin repetir |
| **Reintenta si Expo falla** | 3 reintentos; si igual falla, el aviso queda `fallido` y se puede reintentar desde el panel |
| **Confirma la entrega** | 15-20 minutos después le pregunta a Expo cuántos entregó Google/Apple y lo suma al aviso |
| **Borra los teléfonos muertos** | Los que desinstalaron la app (Expo responde `DeviceNotRegistered`) |
| **Suelta la cuenta al darla de baja** | Si se elimina una cuenta, sus teléfonos quedan anónimos y siguen recibiendo avisos |

---

## 3. Configuración única (Expo, Firebase, EAS)

Se hace **una vez**. Sin esto la app no puede recibir notificaciones.

### 3.1 Paquete y `app.json`

```bash
npx expo install expo-notifications
# expo-device y expo-constants ya están instalados
eas init            # si el proyecto todavía no está vinculado a EAS: agrega extra.eas.projectId
```

```jsonc
// app.json (lo nuevo)
{
  "expo": {
    "plugins": [
      // …los que ya están…
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",   // Android: PNG blanco sobre transparente, 96×96
          "color": "#1e3a8a"                                  // color del ícono en la barra
        }
      ]
    ],
    "android": {
      // …lo que ya está…
      "googleServicesFile": "./google-services.json"
    },
    "extra": {
      "eas": { "projectId": "<lo completa eas init>" }
    }
  }
}
```

> El ícono de notificación de Android **tiene que ser blanco sobre fondo
> transparente**. Con el ícono de la app a color, Android muestra un cuadrado gris.

### 3.2 Android: Firebase (FCM)

Expo manda las notificaciones de Android a través de Firebase. Hacen falta
dos archivos del **mismo** proyecto de Firebase:

1. [console.firebase.google.com](https://console.firebase.google.com) → crear un proyecto (o usar uno existente).
2. **Agregar app Android** con el package **`io.rrdev.facturacion`** → descargar
   `google-services.json` → ponerlo en la raíz del repo del front (es el que
   referencia `app.json`).
3. Firebase → ⚙️ Configuración del proyecto → **Cuentas de servicio** →
   **Generar nueva clave privada** → se descarga un JSON (este **sí es secreto**:
   no va al repo).
4. Subir esa clave a Expo:
   ```bash
   eas credentials
   # Android → production → Google Service Account
   #   → "Manage your Google Service Account Key for Push Notifications (FCM V1)"
   #   → subir el JSON del paso 3
   ```
   (También se puede desde expo.dev → el proyecto → Credentials.)

### 3.3 iOS (solo si se publica en iOS)

Con una cuenta de Apple Developer, `eas build -p ios` ofrece crear la clave de
push (APNs) y la carga sola. Se puede revisar con `eas credentials`.

### 3.4 Nueva build

`expo-notifications` y `google-services.json` cambian la parte nativa:
**hay que generar una build nueva** (`eas build`). Para desarrollar, una
*development build* (`eas build --profile development` o `npx expo run:android`).

> ⚠️ **Expo Go no recibe notificaciones push en Android** (desde el SDK 53).
> Hay que probar con una development build en un **teléfono físico**.

### 3.5 Back

No hay nada que configurar. Solo si en expo.dev → Project settings se activa
*Enhanced security for push notifications*, hay que poner el access token de
Expo en `EXPO_ACCESS_TOKEN` del `.env` del back.

---

## 4. App: registrar el teléfono

La app le pasa al back su **token de Expo** (`ExponentPushToken[…]`). El back
lo guarda y le manda los avisos a todos los tokens que tiene.

### 4.1 `POST /app/dispositivos`

Pública: funciona con o sin sesión. **Nunca responde 401** (con un token de
sesión vencido lo registra como anónimo).

```jsonc
// Headers: los de siempre del baseApi (X-App-Plataforma, X-App-Version, Authorization si hay sesión)
// Body
{ "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" }
// "plataforma": "android" | "ios" es opcional: si no viene, sale de X-App-Plataforma

// → 200
{ "registrado": true }
```

| Con sesión | Sin sesión |
| --- | --- |
| El teléfono queda asociado a esa cuenta | Queda anónimo |
| Recibe los avisos | **Recibe los avisos igual** |

| Error | Cuándo |
| --- | --- |
| `400` + `detalles.campos.token` | El token no tiene formato de Expo |
| `400` + `detalles.campos.plataforma` | Plataforma que no es `android` ni `ios` (en web **no se llama**) |
| `429` | Más de 60 registros en 15 minutos desde la misma IP |

**Cuándo llamarlo:**

| Momento | Por qué |
| --- | --- |
| Al abrir la app, cuando se sabe si hay sesión (`selectSesionVerificada`) | El token puede cambiar, y así el back sabe que el teléfono sigue activo |
| Después de iniciar sesión | Para asociarlo a la cuenta |
| Después de cerrar sesión | Queda anónimo (sigue recibiendo avisos) |

Con el hook de la sección 4.4, las tres cosas salen solas: se vuelve a
registrar cada vez que cambia el token de sesión.

### 4.2 Los endpoints de la app en RTK Query

```ts
// src/features/notificaciones/api/notificacionesApi.ts
import { baseApi } from '@/services/api';

import { avisosAppSchema } from '../schemas';
import type { AvisosApp } from '../types';

export const notificacionesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    registrarDispositivo: build.mutation<{ registrado: true }, { token: string }>({
      query: (body) => ({ url: '/app/dispositivos', method: 'POST', body }),
    }),
    avisosApp: build.query<AvisosApp, void>({
      query: () => ({ url: '/app/avisos' }),
      transformResponse: (r: unknown) => avisosAppSchema.parse(r),
      providesTags: ['Aviso'],
    }),
  }),
});

export const { useRegistrarDispositivoMutation, useAvisosAppQuery } = notificacionesApi;
```

> Sumar `'Aviso'` y `'AdminAviso'` a `TAGS_API` en `src/services/api/baseApi.ts`.

### 4.3 Pedir el permiso y obtener el token

```ts
// src/features/notificaciones/lib/tokenPush.ts
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** El back manda los avisos por este canal: tiene que existir en el teléfono. */
export const CANAL_AVISOS = 'avisos';

/**
 * El token de Expo de este teléfono, o null si no se puede (web, emulador,
 * permiso denegado). Con `pedirPermiso` muestra el diálogo del sistema si
 * todavía no se contestó; sin él, solo devuelve el token si ya estaba permitido.
 */
export async function obtenerTokenPush({ pedirPermiso }: { pedirPermiso: boolean }): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  // Android: el canal va ANTES de pedir el permiso. Sin el canal "avisos",
  // Android no muestra las notificaciones que manda el back.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_AVISOS, {
      name: 'Avisos de la app',
      description: 'Mantenimientos, novedades y versiones nuevas',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  let { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status !== 'granted' && pedirPermiso && canAskAgain) {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('Falta extra.eas.projectId en app.json (correr eas init)');

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}
```

### 4.4 El hook que lo registra

```ts
// src/features/notificaciones/hooks/useRegistrarDispositivo.ts
import { useEffect } from 'react';

import { selectSesionVerificada, selectToken } from '@/features/auth/store/authSlice';
import { useAppSelector } from '@/store/hooks';

import { useRegistrarDispositivoMutation } from '../api/notificacionesApi';
import { obtenerTokenPush } from '../lib/tokenPush';

/**
 * Registra el teléfono al arrancar y cada vez que cambia la sesión. El
 * Authorization lo pone el baseApi: con sesión queda asociado a la cuenta,
 * sin sesión queda anónimo. Va una sola vez, en la raíz (src/app/_layout.tsx).
 */
export function useRegistrarDispositivo() {
  const verificada = useAppSelector(selectSesionVerificada);
  const token = useAppSelector(selectToken);
  const [registrar] = useRegistrarDispositivoMutation();

  useEffect(() => {
    if (!verificada) return;
    let cancelado = false;

    // El permiso se pide recién con la sesión iniciada (ver abajo).
    obtenerTokenPush({ pedirPermiso: token !== null })
      .then((tokenPush) => {
        if (tokenPush && !cancelado) void registrar({ token: tokenPush });
      })
      .catch(() => {
        // Sin notificaciones la app funciona igual: nunca se corta el arranque por esto.
      });

    return () => {
      cancelado = true;
    };
  }, [verificada, token, registrar]);
}
```

**Cuándo pedir el permiso:** en Android 13+ e iOS el sistema muestra un
diálogo, y si la persona dice que no dos veces ya no se puede volver a
preguntar. Por eso el hook lo pide **recién con la sesión iniciada** (la
persona ya confía en la app), no en la primera pantalla. En Android 12 o
menos no hay diálogo: el teléfono queda registrado desde el primer arranque,
aunque no inicie sesión.

> Recomendado: en **Configuración** una fila "Notificaciones: activadas /
> desactivadas". Si están desactivadas y `canAskAgain` es `false`, el botón
> abre los ajustes del sistema con `Linking.openSettings()`.

---

## 5. App: mostrar y abrir las notificaciones

### 5.1 Con la app abierta

Por defecto, si la app está en primer plano **no se muestra nada**. Para que
el aviso aparezca igual (una sola vez, al cargar el módulo):

```ts
// src/features/notificaciones/lib/configurar.ts  (importarlo desde src/app/_layout.tsx)
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

### 5.2 Lo que trae cada notificación

```jsonc
// notification.request.content
{
  "title": "Mantenimiento el domingo",
  "body": "El domingo 28/09 de 2 a 6 hs la app va a estar en mantenimiento.",
  "data": {
    "origen": "aviso",                 // siempre "aviso" (a futuro puede haber otros orígenes)
    "tipo": "mantenimiento",           // "novedad" | "mantenimiento" | "version" | "aviso"
    "avisoId": "6ab5…",                // no viene en las pruebas del super_admin
    "prueba": true,                    // solo en las pruebas
    "urlTienda": "https://play.google.com/…"   // solo si tipo === "version"
  }
}
```

En Android sale por el canal `avisos` (sección 4.3).

### 5.3 Al tocarla

| `data.tipo` | Qué hace la app |
| --- | --- |
| `"version"` | Abre la tienda (`data.urlTienda`) |
| cualquier otro | Abre la pantalla de avisos (`/avisos`) |

```ts
// src/features/notificaciones/hooks/useAbrirAvisos.ts  (una vez, en la raíz)
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Linking } from 'react-native';

import { baseApi } from '@/services/api';
import { useAppDispatch } from '@/store/hooks';

function abrir(respuesta: Notifications.NotificationResponse) {
  const data = respuesta.notification.request.content.data as Record<string, unknown> | undefined;
  if (data?.['origen'] !== 'aviso') return;

  if (data['tipo'] === 'version' && typeof data['urlTienda'] === 'string') {
    void Linking.openURL(data['urlTienda']);
    return;
  }
  router.push('/avisos');
}

export function useAbrirAvisos() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // La app estaba cerrada y se abrió tocando la notificación.
    void Notifications.getLastNotificationResponseAsync().then((r) => r && abrir(r));

    // La app estaba abierta o en segundo plano.
    const alTocar = Notifications.addNotificationResponseReceivedListener(abrir);

    // Llegó un aviso con la app abierta: la lista se vuelve a pedir.
    const alLlegar = Notifications.addNotificationReceivedListener(() => {
      dispatch(baseApi.util.invalidateTags(['Aviso']));
    });

    return () => {
      alTocar.remove();
      alLlegar.remove();
    };
  }, [dispatch]);
}
```

> Revisar los nombres contra la doc de `expo-notifications` del SDK 57: en los
> SDK nuevos también existe `getLastNotificationResponse()` (sincrónica) y el
> hook `useLastNotificationResponse()`. Cualquiera sirve; lo importante es
> manejar el caso de la app cerrada **y** el de la app abierta.

`/avisos` tiene que abrir **con o sin sesión**: el que tocó la notificación
puede no haber iniciado sesión nunca. Si `ArranqueSesion` manda a `/login` a
todo el que no tiene sesión, `/avisos` tiene que quedar como excepción.

---

## 6. App: la pantalla de avisos

### `GET /app/avisos`

Pública (sin login). Los **últimos 20 avisos de los últimos 90 días**, el más
nuevo primero. Cache de 60 s.

```jsonc
// → 200
{
  "datos": [
    {
      "_id": "6ab5…",
      "titulo": "Nueva versión 1.5",
      "mensaje": "Actualizá para ver las métricas nuevas.",
      "tipo": "version",
      "fecha": "2026-09-24T16:10:05.123Z",
      "urlTienda": "https://play.google.com/store/apps/details?id=io.rrdev.facturacion"   // solo en "version"
    },
    {
      "_id": "6ab5…",
      "titulo": "Mantenimiento el domingo",
      "mensaje": "El domingo 28/09 de 2 a 6 hs la app va a estar en mantenimiento.",
      "tipo": "mantenimiento",
      "fecha": "2026-09-24T16:09:40.001Z"
    }
  ]
}
```

**Pantalla sugerida** (`src/app/avisos.tsx`): una lista de tarjetas.

| `tipo` | Ícono sugerido | Etiqueta |
| --- | --- | --- |
| `novedad` | ✨ | Novedad |
| `mantenimiento` | 🔧 | Mantenimiento |
| `version` | ⬆️ | Versión nueva + botón **Actualizar** (abre `urlTienda`) |
| `aviso` | 📣 | Aviso |

Cada tarjeta: ícono y etiqueta, `titulo` en negrita, `mensaje` completo,
`fecha` relativa ("hace 2 horas"). Vacía: "No hay avisos por ahora".

> Opcional: un punto rojo en el acceso a Avisos si hay alguno más nuevo que el
> último que vio la persona (guardar la `fecha` del último visto en el storage).

---

## 7. Panel super_admin: mandar avisos

Todo con `Authorization: Bearer <token de super_admin>`. Un administrador
recibe `403 { "error": "Solo el super_admin puede hacer esto" }` y sin sesión
es `401`.

**Pantallas sugeridas** (dentro de `src/app/super-admin/`, y **Avisos** en el menú del panel):

```
avisos/index.tsx   → historial + botón "Nuevo aviso"
avisos/nuevo.tsx   → redactar, vista previa, alcance, enviar prueba, enviar
avisos/[id].tsx    → detalle con el avance del envío
```

| Pantalla | Qué muestra | Acciones |
| --- | --- | --- |
| **Historial** | Los avisos enviados, con estado y cuántos llegaron | Nuevo aviso |
| **Nuevo aviso** | Formulario, vista previa, "le llega a N teléfonos" | Enviar prueba, Enviar (con confirmación) |
| **Detalle** | El aviso, el avance del envío y las confirmaciones | Reintentar (si falló), Borrar |

### 7.1 Los endpoints del panel en RTK Query

```ts
// src/features/super-admin/api/avisosApi.ts
import { baseApi } from '@/services/api';

import { alcanceAvisosSchema, avisoSchema, detalleAvisoSchema, paginadoAvisosSchema, resultadoPruebaSchema } from '../schemas';
import type { AlcanceAvisos, Aviso, DetalleAviso, NuevoAviso, PaginadoAvisos, ResultadoPrueba } from '../types';

export const avisosApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    alcanceAvisos: build.query<AlcanceAvisos, void>({
      query: () => ({ url: '/admin/avisos/alcance' }),
      transformResponse: (r: unknown) => alcanceAvisosSchema.parse(r),
      providesTags: [{ type: 'AdminAviso', id: 'ALCANCE' }],
    }),
    avisosAdmin: build.query<PaginadoAvisos, { pagina?: number; porPagina?: number }>({
      query: (params) => ({ url: '/admin/avisos', params }),
      transformResponse: (r: unknown) => paginadoAvisosSchema.parse(r),
      providesTags: [{ type: 'AdminAviso', id: 'LISTA' }],
    }),
    avisoAdmin: build.query<DetalleAviso, string>({
      query: (id) => ({ url: `/admin/avisos/${id}` }),
      transformResponse: (r: unknown) => detalleAvisoSchema.parse(r),
      providesTags: (_r, _e, id) => [{ type: 'AdminAviso', id }],
    }),
    enviarPruebaAviso: build.mutation<ResultadoPrueba, NuevoAviso>({
      query: (body) => ({ url: '/admin/avisos/prueba', method: 'POST', body }),
      transformResponse: (r: unknown) => resultadoPruebaSchema.parse(r),
    }),
    crearAviso: build.mutation<Aviso, NuevoAviso>({
      query: (body) => ({ url: '/admin/avisos', method: 'POST', body }),
      transformResponse: (r: unknown) => avisoSchema.parse(r),
      invalidatesTags: [{ type: 'AdminAviso', id: 'LISTA' }, 'Aviso'],
    }),
    reintentarAviso: build.mutation<DetalleAviso, string>({
      query: (id) => ({ url: `/admin/avisos/${id}/reintentar`, method: 'POST' }),
      transformResponse: (r: unknown) => detalleAvisoSchema.parse(r),
      invalidatesTags: (_r, _e, id) => [{ type: 'AdminAviso', id }, { type: 'AdminAviso', id: 'LISTA' }],
    }),
    borrarAviso: build.mutation<{ mensaje: string }, string>({
      query: (id) => ({ url: `/admin/avisos/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminAviso', id: 'LISTA' }, 'Aviso'],
    }),
  }),
});

export const {
  useAlcanceAvisosQuery,
  useAvisosAdminQuery,
  useAvisoAdminQuery,
  useEnviarPruebaAvisoMutation,
  useCrearAvisoMutation,
  useReintentarAvisoMutation,
  useBorrarAvisoMutation,
} = avisosApi;
```

### 7.2 Alcance: `GET /admin/avisos/alcance`

A cuántos teléfonos le llegaría un aviso **ahora**. Para mostrarlo en la
pantalla de redactar y en el diálogo de confirmación.

```jsonc
// → 200
{
  "dispositivos": 241,                        // a todos estos les llega
  "porPlataforma": { "android": 181, "ios": 60 },
  "conSesion": 190,                           // asociados a una cuenta
  "sinSesion": 51,                            // app instalada, sin sesión
  "cuentas": 150,                             // cuentas distintas alcanzadas
  "activos30d": 151                           // abrieron la app en los últimos 30 días
}
```

Las cuentas **suspendidas** no se cuentan ni reciben avisos.

### 7.3 Enviar una prueba: `POST /admin/avisos/prueba`

Manda el aviso **solo a los teléfonos del super_admin**, para ver cómo queda
antes de mandarlo a todos. No se guarda ni aparece en la lista de la app.

```jsonc
// Body: igual que el envío real
{ "titulo": "Mantenimiento el domingo", "mensaje": "El domingo 28/09 de 2 a 6 hs…", "tipo": "mantenimiento" }

// → 200
{ "dispositivos": 1, "enviados": 1, "rechazados": 0, "errores": {} }
```

| Error | Cuándo | Qué mostrar |
| --- | --- | --- |
| `409` `SIN_DISPOSITIVOS` | El super_admin no tiene ningún teléfono registrado | "Abrí la app en tu teléfono con esta cuenta y aceptá las notificaciones" |
| `400` + `detalles.campos` | Título o mensaje vacío o largo | Debajo del input |

Si `errores` trae `InvalidCredentials`, falta la configuración de Firebase
(sección 3.2): mostrarlo en rojo.

### 7.4 Enviar a todos: `POST /admin/avisos`

```jsonc
// Body
{
  "titulo": "Mantenimiento el domingo",    // requerido, hasta 60 caracteres
  "mensaje": "El domingo 28/09 de 2 a 6 hs la app va a estar en mantenimiento. No vas a poder cargar tickets en ese horario.",  // requerido, hasta 500
  "tipo": "mantenimiento"                  // opcional: "novedad" | "mantenimiento" | "version" | "aviso" (default)
}

// → 202 Accepted: el aviso ya está guardado y se está mandando en segundo plano
{
  "_id": "6ab5…",
  "titulo": "Mantenimiento el domingo",
  "mensaje": "…",
  "tipo": "mantenimiento",
  "creadoPor": "6ab4…",
  "estado": "enviando",
  "envio": { "dispositivos": 242, "enviados": 0, "rechazados": 0, "entregados": 0, "fallidos": 0, "errores": {} },
  "createdAt": "…",
  "updatedAt": "…"
}
```

Después del `202`, navegar al detalle (`/super-admin/avisos/<_id>`) para ver
el avance.

| Error | Cuándo | Qué hacer |
| --- | --- | --- |
| `400` + `detalles.campos.titulo` / `.mensaje` / `.tipo` | Validación | Debajo del input |
| `409` `AVISO_REPETIDO` | El mismo título y mensaje hace menos de 10 minutos (doble clic) | Toast "Ya lo mandaste hace un momento" y abrir `detalles.aviso` si viene |

> **No se puede deshacer:** la notificación llega a los teléfonos al instante.
> Usar siempre un diálogo de confirmación con el alcance:
> *"Se va a mandar a **241 teléfonos**. ¿Enviar?"* · y deshabilitar el botón
> mientras está el pedido en curso.

```ts
// En la pantalla avisos/nuevo.tsx
const [crearAviso, { isLoading: enviando }] = useCrearAvisoMutation();

async function enviar(datos: NuevoAviso) {
  try {
    const aviso = await crearAviso(datos).unwrap();
    router.replace(`/super-admin/avisos/${aviso._id}`);
  } catch (fallo) {
    const e = interpretarError(fallo);
    if (e?.codigo === 'AVISO_REPETIDO') {
      // El toast de la app: "Ya mandaste este aviso hace un momento"
      const id = e.datos?.['aviso'];
      if (typeof id === 'string') router.replace(`/super-admin/avisos/${id}`);
      return;
    }
    setErroresDeCampo(e?.campos ?? {});                    // debajo de cada input
    setError(e?.campos ? null : (e?.mensaje ?? 'No se pudo enviar el aviso'));
  }
}
```

**Formulario sugerido:**

```
┌───────────────────────────────────────────┐
│ Tipo   [✨ Novedad][🔧 Mantenimiento]      │
│        [⬆️ Versión][📣 Aviso]              │
│ Título ______________________    23/60    │
│ Mensaje                                   │
│ _________________________________         │
│ _________________________________ 120/500 │
│                                           │
│ Vista previa                              │
│ ┌───────────────────────────────────────┐ │
│ │ 🔔 Facturación FCT · ahora            │ │
│ │ Mantenimiento el domingo              │ │
│ │ El domingo 28/09 de 2 a 6 hs la app…  │ │
│ └───────────────────────────────────────┘ │
│ Le llega a 241 teléfonos                  │
│ [ Enviar prueba a mi teléfono ] [Enviar]  │
└───────────────────────────────────────────┘
```

Tips para el texto (se pueden mostrar como ayuda debajo del formulario):
el título corto y concreto ("Mantenimiento el domingo", no "Aviso
importante"); en el mensaje, **qué pasa, cuándo y qué tiene que hacer la
persona**. En la notificación Android muestra ~2 líneas del mensaje; completo
se lee en la pantalla de avisos.

### 7.5 Historial: `GET /admin/avisos`

Paginado (`pagina`, `porPagina`), el más nuevo primero.

```jsonc
// → 200
{
  "datos": [
    {
      "_id": "6ab5…",
      "titulo": "Mantenimiento el domingo",
      "mensaje": "…",
      "tipo": "mantenimiento",
      "creadoPor": { "_id": "…", "nombre": "Super Admin", "email": "…" },   // null si esa cuenta ya no existe
      "estado": "enviado",               // "enviando" | "enviado" | "fallido"
      "enviadoEl": "…",                  // cuando terminó (solo "enviado")
      "envio": {
        "dispositivos": 242,
        "enviados": 235,
        "rechazados": 7,
        "entregados": 220,
        "fallidos": 5,
        "errores": { "DeviceNotRegistered": 10, "InvalidCredentials": 2 },
        "ultimoError": "…"               // solo si "fallido"
      },
      "createdAt": "…", "updatedAt": "…"
    }
  ],
  "total": 12, "pagina": 1, "porPagina": 20, "paginas": 1
}
```

**Renglón sugerido:** ícono del tipo · título · fecha · chip de estado ·
"entregado a 220 de 242".

| `estado` | Chip |
| --- | --- |
| `enviando` | 🔵 Enviando… (con barra: `(enviados + rechazados) / dispositivos`) |
| `enviado` | 🟢 Enviado |
| `fallido` | 🔴 Falló — botón **Reintentar** |

### 7.6 Detalle: `GET /admin/avisos/:id`

```jsonc
// → 200
{
  "aviso": { /* igual que un renglón del historial */ },
  "sinConfirmar": 15    // aceptados por Expo que todavía esperan la confirmación de Google/Apple
}
```

**Avance en vivo:** mientras `estado === "enviando"`, volver a pedirlo cada
2 segundos:

```ts
// En la pantalla avisos/[id].tsx
const [intervalo, setIntervalo] = useState(2000);
const { data } = useAvisoAdminQuery(id, { pollingInterval: intervalo });
const estado = data?.aviso.estado;

useEffect(() => {
  setIntervalo(estado === 'enviando' ? 2000 : 0);   // 0 = deja de consultar
}, [estado]);
```

Las confirmaciones (`entregados` / `fallidos`) llegan **15 a 20 minutos
después** del envío: mostrar "Esperando confirmación de 15 teléfonos" mientras
`sinConfirmar > 0`, con un botón (o pull-to-refresh) para actualizar.

`404 { "error": "Aviso no encontrado" }` si el id no existe.

### 7.7 Reintentar: `POST /admin/avisos/:id/reintentar`

Solo para un aviso `fallido` (Expo no respondió después de varios
intentos). Sigue **desde donde quedó**: a quien ya le llegó no se le manda de
nuevo.

```jsonc
// → 202: el mismo objeto que GET /admin/avisos/:id, con estado "enviando"
```

`409` si el aviso no está `fallido`.

### 7.8 Borrar: `DELETE /admin/avisos/:id`

Lo saca del historial **y de la lista de la app**. La notificación que ya
llegó a los teléfonos **no se puede borrar**: si hubo un error en el texto,
mandar otro aviso con la corrección.

```jsonc
// → 200
{ "mensaje": "Aviso borrado" }
```

`409` si todavía se está enviando.

---

## 8. Errores

Todos vienen como `{ error, codigo?, detalles? }` y se leen con
`interpretarError(fallo)` de `@/shared/utils`, que devuelve
`{ mensaje, codigo, campos, datos }`:

| `interpretarError` | Viene de | Uso |
| --- | --- | --- |
| `mensaje` | `error` | El texto para mostrar |
| `codigo` | `codigo` | Decidir sin leer el mensaje (`AVISO_REPETIDO`, `SIN_DISPOSITIVOS`) |
| `campos` | `detalles.campos` | Mensajes debajo de cada input (`titulo`, `mensaje`, `tipo`, `token`, `plataforma`) |
| `datos` | el resto de `detalles` | Datos para la pantalla (`aviso` en `AVISO_REPETIDO`) |

**Todos los errores de esta funcionalidad:**

| Status | `codigo` | Endpoint | Cuándo | Qué hacer |
| --- | --- | --- | --- | --- |
| `400` | — | `POST /app/dispositivos` | Token o plataforma inválidos (`campos.token` / `campos.plataforma`) | Nada visible: la app sigue sin notificaciones |
| `429` | — | `POST /app/dispositivos` | Más de 60 registros en 15 min desde la misma IP | Nada: se registra en el próximo arranque |
| `400` | — | `POST /admin/avisos`, `/prueba` | Título, mensaje o tipo inválidos (`campos.*`) | Mensaje debajo del input |
| `409` | `AVISO_REPETIDO` | `POST /admin/avisos` | El mismo aviso hace menos de 10 min | Toast y abrir `datos.aviso` si viene |
| `409` | `SIN_DISPOSITIVOS` | `POST /admin/avisos/prueba` | El super_admin no tiene teléfonos registrados | "Abrí la app con esta cuenta y aceptá las notificaciones" |
| `409` | — | `POST /admin/avisos/:id/reintentar` | El aviso no está `fallido` | Refrescar el detalle |
| `409` | — | `DELETE /admin/avisos/:id` | El aviso se está enviando | "Esperá a que termine" |
| `404` | — | `/admin/avisos/:id…` | El aviso no existe | Volver al historial |
| `403` | — | `/admin/avisos…` | No es super_admin | No debería pasar: el panel solo lo ve el super_admin |
| `401` | — | `/admin/avisos…` | Sesión vencida | El `sesionCaidaMiddleware` de siempre |

---

## 9. Qué significa cada número del envío

```
dispositivos ── a cuántos teléfonos se le iba a mandar cuando arrancó
  ├─ rechazados ── Expo no lo aceptó (token dado de baja, credenciales…)
  └─ enviados ──── Expo lo aceptó
        ├─ entregados ── Google/Apple confirmó que lo entregó   (15-20 min después)
        ├─ fallidos ──── Google/Apple no lo pudo entregar
        └─ sinConfirmar  todavía sin respuesta (a las 24 h se deja de esperar)
```

"Entregado" quiere decir que llegó al teléfono. Si la persona tiene las
notificaciones de la app apagadas, igual cuenta como entregado.

**`errores`**: cuántas veces apareció cada código de Expo:

| Código | Qué pasó | ¿Hay que hacer algo? |
| --- | --- | --- |
| `DeviceNotRegistered` | Desinstaló la app o el token cambió | No: el back borra ese teléfono solo |
| `InvalidCredentials` | Expo no tiene la clave de Firebase (FCM V1) o de Apple | **Sí**: sección 3.2 / 3.3 |
| `MismatchSenderId` | `google-services.json` y la clave de FCM son de proyectos de Firebase distintos | **Sí**: usar los dos del mismo proyecto |
| `MessageTooBig` | El aviso pesa más de 4 KB | No debería pasar con los topes de 60/500 |
| `MessageRateExceeded` | Demasiadas notificaciones seguidas a un mismo teléfono | Esperar |

> Si `InvalidCredentials` o `MismatchSenderId` aparecen, conviene mostrar un
> cartel rojo en el panel: "Las notificaciones no están llegando: revisá las
> credenciales push en EAS".

---

## 10. Tipos TypeScript y esquemas zod

```ts
// ─── App: src/features/notificaciones/types.ts ───
export type TipoAviso = 'novedad' | 'mantenimiento' | 'version' | 'aviso';

export interface AvisoApp {
  _id: string;
  titulo: string;
  mensaje: string;
  tipo: TipoAviso;
  fecha: string;
  urlTienda?: string;       // solo tipo "version"
}
export interface AvisosApp {
  datos: AvisoApp[];
}

/** El `data` de cada notificación. */
export interface DataNotificacionAviso {
  origen: 'aviso';
  tipo: TipoAviso;
  avisoId?: string;         // no viene en las pruebas
  prueba?: true;
  urlTienda?: string;
}

// ─── Panel: src/features/super-admin/types.ts ───
export type EstadoAviso = 'enviando' | 'enviado' | 'fallido';

export interface EnvioAviso {
  dispositivos: number;
  enviados: number;
  rechazados: number;
  entregados: number;
  fallidos: number;
  errores: Record<string, number>;
  ultimoError?: string;
}

export interface Aviso {
  _id: string;
  titulo: string;
  mensaje: string;
  tipo: TipoAviso;
  /** Con el autor en el historial y el detalle; solo el id al crear; null si la cuenta ya no existe. */
  creadoPor: { _id: string; nombre: string; email: string } | string | null;
  estado: EstadoAviso;
  enviadoEl?: string;
  envio: EnvioAviso;
  createdAt: string;
  updatedAt: string;
}

export interface PaginadoAvisos {
  datos: Aviso[];
  total: number;
  pagina: number;
  porPagina: number;
  paginas: number;
}

export interface DetalleAviso {
  aviso: Aviso;
  sinConfirmar: number;
}

export interface AlcanceAvisos {
  dispositivos: number;
  porPlataforma: { android: number; ios: number };
  conSesion: number;
  sinSesion: number;
  cuentas: number;
  activos30d: number;
}

export interface NuevoAviso {
  titulo: string;           // 1-60
  mensaje: string;          // 1-500
  tipo?: TipoAviso;
}

export interface ResultadoPrueba {
  dispositivos: number;
  enviados: number;
  rechazados: number;
  errores: Record<string, number>;
}
```

```ts
// ─── Esquemas zod (como el resto de las features) ───
import { z } from 'zod';

export const tipoAvisoSchema = z.enum(['novedad', 'mantenimiento', 'version', 'aviso']);

// App: src/features/notificaciones/schemas.ts
export const avisosAppSchema = z.object({
  datos: z.array(
    z.object({
      _id: z.string(),
      titulo: z.string(),
      mensaje: z.string(),
      tipo: tipoAvisoSchema,
      fecha: z.string(),
      urlTienda: z.string().optional(),
    }),
  ),
});

// Panel: src/features/super-admin/schemas.ts
const envioAvisoSchema = z.object({
  dispositivos: z.number(),
  enviados: z.number(),
  rechazados: z.number(),
  entregados: z.number(),
  fallidos: z.number(),
  errores: z.record(z.string(), z.number()),
  ultimoError: z.string().optional(),
});

export const avisoSchema = z.object({
  _id: z.string(),
  titulo: z.string(),
  mensaje: z.string(),
  tipo: tipoAvisoSchema,
  creadoPor: z.union([z.object({ _id: z.string(), nombre: z.string(), email: z.string() }), z.string()]).nullable(),
  estado: z.enum(['enviando', 'enviado', 'fallido']),
  enviadoEl: z.string().optional(),
  envio: envioAvisoSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const paginadoAvisosSchema = z.object({
  datos: z.array(avisoSchema),
  total: z.number(),
  pagina: z.number(),
  porPagina: z.number(),
  paginas: z.number(),
});

export const detalleAvisoSchema = z.object({ aviso: avisoSchema, sinConfirmar: z.number() });

export const alcanceAvisosSchema = z.object({
  dispositivos: z.number(),
  porPlataforma: z.object({ android: z.number(), ios: z.number() }),
  conSesion: z.number(),
  sinSesion: z.number(),
  cuentas: z.number(),
  activos30d: z.number(),
});

export const resultadoPruebaSchema = z.object({
  dispositivos: z.number(),
  enviados: z.number(),
  rechazados: z.number(),
  errores: z.record(z.string(), z.number()),
});
```

---

## 11. Cómo probarlo y problemas comunes

**Primera prueba de punta a punta:**

1. Hacer la configuración de la sección 3 y generar una development build.
2. Instalarla en un **teléfono físico**, entrar **con la cuenta del super_admin**
   y aceptar las notificaciones.
3. `GET /admin/avisos/alcance` → tiene que decir al menos `dispositivos: 1`.
4. En el panel, **Enviar prueba** → la notificación llega al teléfono.
5. Probar las tres situaciones: app abierta, en segundo plano y cerrada, y
   que al tocarla abra la pantalla de avisos (o la tienda si es `version`).
6. Mandar un aviso real a todos y seguir el avance en el detalle; a los 15-20
   minutos tienen que aparecer los `entregados`.

| Problema | Causa probable |
| --- | --- |
| `enviados: 1` pero no llega nada | Falta el canal `avisos` en Android (sección 4.3), o las notificaciones de la app están apagadas en el teléfono |
| `errores: { "InvalidCredentials": 1 }` | Falta subir la clave de FCM V1 a EAS (sección 3.2, paso 4) |
| `errores: { "MismatchSenderId": 1 }` | `google-services.json` y la clave de FCM son de proyectos de Firebase distintos |
| `getExpoPushTokenAsync` falla | Falta `extra.eas.projectId` (`eas init`) o se está usando Expo Go en Android |
| `SIN_DISPOSITIVOS` en la prueba | El teléfono se registró sin sesión: abrir la app con la cuenta del super_admin |
| Con la app abierta no aparece | Falta `setNotificationHandler` (sección 5.1) |
| Ícono gris en la barra de Android | El ícono de notificación no es blanco sobre transparente |
| Al tocarla manda a `/login` | `/avisos` no quedó como excepción en `ArranqueSesion` (sección 5.3) |

Expo también tiene una herramienta para mandar una notificación a mano a un
token y descartar problemas del back: [expo.dev/notifications](https://expo.dev/notifications).

---

## 12. Tabla de endpoints

| Método | Ruta | Auth | Para qué | Respuesta |
| --- | --- | --- | --- | --- |
| `POST` | `/app/dispositivos` | opcional | La app registra su token de Expo | `{ registrado: true }` |
| `GET` | `/app/avisos` | no | Los últimos avisos, para la pantalla de avisos | `AvisosApp` |
| `GET` | `/admin/avisos/alcance` | super_admin | A cuántos teléfonos le llegaría | `AlcanceAvisos` |
| `POST` | `/admin/avisos/prueba` | super_admin | Mandarlo solo a mis teléfonos | `ResultadoPrueba` |
| `POST` | `/admin/avisos` | super_admin | Mandarlo a todos (sigue en segundo plano) | `202 Aviso` |
| `GET` | `/admin/avisos` | super_admin | Historial paginado | `PaginadoAvisos` |
| `GET` | `/admin/avisos/:id` | super_admin | Detalle y avance | `DetalleAviso` |
| `POST` | `/admin/avisos/:id/reintentar` | super_admin | Seguir un envío fallido | `202 DetalleAviso` |
| `DELETE` | `/admin/avisos/:id` | super_admin | Sacarlo del historial y de la app | `{ mensaje }` |
