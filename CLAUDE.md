@AGENTS.md

# CLAUDE.md

> Frontend de una app móvil en **React Native con Expo** (managed workflow / CNG — Continuous Native Generation), New Architecture. **SDK 57** (React Native 0.86, React 19.2).
> Este archivo define la **arquitectura, el stack y las reglas de cómo programar**. Seguilas en cada tarea.
> Este repo es **solo frontend**: consume una API REST que vive en otro proyecto. No maneja base de datos ni ORM.
>
> Generado durante el bootstrap a partir de `.claude/CLAUDE-EXPO.md`, **adaptado a las decisiones reales del proyecto**. Si los dos archivos se contradicen, **manda este**. Ver «Desvíos respecto de la plantilla» al final.

---

## 🏛️ Arquitectura (principio rector)

**Screaming Architecture** → organización **por features**. La estructura grita el dominio, no el framework.

- Código agrupado por **funcionalidad (feature)**, nunca por tipo de archivo.
- Si lo usa **una sola feature** → vive **dentro** de esa feature.
- Si lo usan **dos o más** → sube a `shared/`.
- ❌ Prohibido crear carpetas globales tipo `screens/` o `components/` sueltas en `src/`.

---

## 📂 Estructura de carpetas

```
app.json / app.config.ts   # Config de Expo: nombre, ícono, splash, plugins, permisos, EAS
eas.json                    # Perfiles de build de EAS (development, preview, production)

src/
├── app/                     # 🧭 RUTAS de expo-router (file-based routing).
│   │                        #    Acá SOLO van archivos de ruta: cada uno re-exporta
│   │                        #    la screen de su feature en una línea.
│   │                        #    ⚠️ Todo lo que pongas acá se vuelve una ruta navegable.
│   ├── _layout.tsx          # Layout raíz: monta <AppProviders> + el <Stack>
│   └── index.tsx            # Ruta "/"
│
├── providers/               # Redux <Provider>, ThemeProvider, SafeArea, GestureHandler.
│                            #    Vive fuera de app/ justamente porque no es una ruta.
│
├── features/                # Una carpeta por funcionalidad
│   └── <feature>/
│       ├── components/      # 🧩 Composiciones SOLO de esta feature
│       ├── screens/         # Pantallas de la feature
│       ├── hooks/           # Hooks de la feature
│       ├── api/             # Endpoints RTK Query (injectEndpoints)
│       ├── store/           # Slice de Redux (estado de cliente)
│       └── types.ts
│
├── shared/                  # Reutilizable en TODA la app
│   ├── ui/
│   │   └── atoms/           # 🎨 ÚNICA carpeta de UI compartida
│   ├── assets/              # 🖼️ Logos e imágenes (ver su README)
│   ├── hooks/               # Hooks genéricos
│   └── utils/               # Helpers, formateadores
│
├── store/                   # Config global de Redux (configureStore + hooks tipados)
│
├── services/
│   ├── api/                 # baseApi de RTK Query (createApi + fetchBaseQuery)
│   └── storage/             # Instancia MMKV + storageService
│
├── theme/                   # Design tokens (primitivos + semánticos) + ThemeProvider/useTheme
│   ├── tokens/               # Primitivos: colors, spacing, typography, radius
│   ├── themes/               # Semánticos: lightTheme, darkTheme
│   └── ThemeProvider.tsx     # Provee el tema y expone useTheme() / useThemeMode()
├── types/                    # Tipos globales
└── config/                   # Variables de entorno (EXPO_PUBLIC_*) + URL base de la API
```

> ⚠️ En managed workflow **no se commitean** `android/` ni `ios/`. Se generan on-demand con `npx expo prebuild` (o `npx expo run:android`/`run:ios` en local) y quedan en `.gitignore`. Cualquier cambio nativo (permisos, ícono, splash, plugins) se hace **siempre** en `app.json` / `app.config.ts`, nunca editando esas carpetas a mano.

---

## 🧱 Capas y flujo de datos

Los componentes **NO** llaman a la API directo. Flujo:

```
Screen → Hook → API slice (RTK Query) → fetchBaseQuery → API REST (externa)
```

- **Screen:** solo arma la UI y usa hooks. Sin lógica de negocio.
- **Estado de servidor** (datos de la API) → **RTK Query** (hooks generados).
- **Estado de cliente** (sesión, UI, preferencias) → **slices de Redux** (`useAppSelector` / `useAppDispatch`).
- **Estado local** de un componente (input, toggle, modal) → `useState` / `useReducer`, **sin librería**.

---

## 🔄 Refrescar (tirar para abajo)

**Toda pantalla que muestre datos de la API tiene que poder refrescarse tirando
para abajo.** No es un extra ni algo que se agrega después: entra junto con la
pantalla, igual que el estado de carga y el de error.

- El gesto se arma **siempre** con el hook compartido **`useRefrescar`**
  (`@/shared/hooks`). ❌ Nunca un `RefreshControl` suelto en la pantalla: en el
  hook viven los colores del theme, el mínimo de spinner visible y el corte
  cuando la pantalla se desmonta a mitad del refresh.
- El hook de la feature expone un **`refrescar: () => Promise<void>`** —el
  `refetch` de RTK Query envuelto—, aparte del `reintentar` que usa el botón del
  cartel de error. **Tiene que devolver la promesa**: es lo que deja la rueda
  girando hasta que llegan los datos.
- Se cuelga del scroll de la pantalla: `refreshControl={refresco.control}` en el
  `FlatList` o el `ScrollView`.
- Mientras dura el gesto, **apagá los otros indicadores de carga** de la pantalla
  (`&& !refresco.refrescando`): dos spinners a la vez se leen como que algo se
  colgó.

```tsx
const ficha = useCliente(clienteId);
const refresco = useRefrescar(ficha.refrescar);

<ScrollView refreshControl={refresco.control}>…</ScrollView>
```

❌ **Dónde no va:** formularios (no hay nada que traer y el gesto sugiere que se
borra lo escrito) y pantallas sin datos de servidor. Si una pantalla es hoy un
placeholder, el día que le enchufes la API le ponés el gesto en la misma tarea.

---

## 📐 Responsive

**La app reacciona al ANCHO DE VENTANA, nunca a la plataforma.** ❌ Prohibido
ramificar layout con `Platform.OS === 'web'`: una tablet en horizontal y una
ventana de navegador angosta tienen el mismo problema que el que se quiera
arreglar, y si se decide por plataforma hay que arreglarlo dos veces.

- **Breakpoints** (`theme.layout.breakpoints`): `sm` 0 · `md` 600 · `lg` 905 · `xl` 1240.
- **`useBreakpoint()`** (`@/shared/hooks`) da el breakpoint activo, el ancho, y
  dos ayudas: `esAlMenos('lg')` y `elegir({ sm, md, lg, xl })`, que resuelve
  mobile-first (toma el valor declarado más cercano hacia abajo).
- **`<Container>`** (`@/shared/ui/atoms`) limita el ancho y centra. **Toda
  pantalla envuelve su contenido en un Container**: sin eso, en un monitor de
  1920px un formulario se estira a todo el ancho y queda ilegible. El ancho sale
  del tipo de contenido, no de un número suelto: `formulario` (440), `contenido`
  (760), `ancho` (1128) o `completo`.

```tsx
<ScrollView>
  <Container ancho="formulario">…</Container>
</ScrollView>
```

> Las fuentes embebidas por el config plugin de `expo-font` **solo existen en
> nativo**. En web los tokens de `theme.typography.family` caen a un stack del
> sistema (y ahí sí llevan `fontWeight`, porque una familia cubre todos los pesos).

---

## 🎨 Design System

Regla única, para no armar un árbol enorme de carpetas:

```
shared/ui/atoms/        → lo que usa TODA la app
features/<x>/components/ → lo que usa UNA sola feature
```

- **`shared/ui/atoms/`** es la **única** carpeta de UI compartida. ❌ No existen `molecules/` ni `organisms/` en `shared/`.
- Va en `atoms/` lo que es **transversal a la app** y **agnóstico del dominio**: `Button`, `Input`, `InputField`, `Text`, `Icon`, `Badge`. No importa si "atómicamente" sería una molécula — el criterio es **quién lo usa**, no su tamaño.
- Las **composiciones** (lo que Atomic Design llamaría molecules y organisms) viven en `features/<feature>/components/`. Cada apartado de la app es distinto, así que compartirlas de entrada solo genera abstracciones prematuras.
- **Regla de promoción:** si una composición de una feature la necesita una **segunda** feature, recién ahí se mueve a `shared/ui/atoms/`. Antes no.
- Los **templates** y **pages** de Atomic Design = nuestras **screens** (viven en cada feature).
- Los componentes de `shared/ui/atoms` **no tienen lógica de negocio ni llaman a la API**: reciben todo por props.

### 🖼️ Assets

- Compartidos por toda la app → `shared/assets/`. De una sola feature → `features/<x>/assets/`. Misma regla de promoción que los componentes.
- **Logos e íconos → SVG.** Se importan como componentes de React vía `react-native-svg` + `react-native-svg-transformer` (config en `metro.config.js`, compatible con Expo): se ven nítidos en cualquier densidad sin mantener `@2x`/`@3x` y siguen el theme vía la prop `color`.
- Al exportar un SVG propio, usá `currentColor` en `fill`/`stroke`. Con hex fijos, la prop `color` no tiene efecto. ❌ Excepción: logos de terceros (Google, Apple) no se recolorean.
- Fotos e ilustraciones → PNG/JPG con `@2x`/`@3x`; se importa solo el nombre base.
- La ruta de un `import` de asset tiene que ser **estática**: Metro los resuelve en build time.
- **El ícono de la app y la splash screen NO son código fuente ni carpetas nativas**: se configuran declarativamente en `app.json` / `app.config.ts` (`icon`, `splash`, `adaptiveIcon` para Android) apuntando a un PNG fuente en `assets/` (convención de Expo, en la raíz del proyecto). Los genera Expo/EAS en build time — nunca se editan `android/app/src/main/res/` ni `ios/<App>/Images.xcassets/` a mano.
- Detalle completo en [`src/shared/assets/README.md`](src/shared/assets/README.md).

> Catálogo vivo: la pantalla **Design System** (botón flotante 🎨, solo en `__DEV__`) lista todos los tokens y atoms existentes. **Mirala antes de crear un componente nuevo.**

---

## 🖌️ Estilos y theme

- **StyleSheet nativo** (sin librerías de estilos externas).
- Los componentes acceden al theme **siempre** vía el hook `useTheme()` (provisto por el `ThemeProvider`, montado en la raíz de la app). ❌ Nunca importar el theme de forma estática en un componente.
- **Tokens en dos capas:** primitivos (valores crudos, ej. `blue500`) en `theme/tokens/`, y semánticos (significado, ej. `primary`, `background`, `text`) en `theme/themes/`. Los componentes usan **solo semánticos**, nunca primitivos.
- ❌ **Prohibido hardcodear valores** (colores, tamaños) en los componentes → siempre desde el theme.
- **Modo claro/oscuro** soportado desde el inicio: `lightTheme` y `darkTheme` con la misma forma, conmutados por el `ThemeProvider`. Persistir la preferencia del usuario en el storage (vía `storageService`). El `userInterfaceStyle` en `app.json` se deja en `"automatic"` para que el SO reporte el modo del sistema.

---

## 🗄️ Storage local

- **MMKV** (`react-native-mmkv`) — síncrono, rápido.
- Siempre se accede vía `services/storage/storageService`. ❌ **Nunca usar la instancia MMKV directo** en componentes o features.
- Token de auth → `secureStorageService`, una instancia MMKV **encriptada** (`encryptionKey`) y separada del storage general.
- **API de MMKV v4** (la instalada): se crea con `createMMKV({ id })`, no con `new MMKV()`; se borra una clave con `remove(key)`, no con `delete(key)`; y los getters devuelven `undefined` (no `null`) cuando la clave no existe. La mayoría de los ejemplos que hay dando vueltas son de v3.
- ⚠️ **En web, MMKV no usa el motor nativo: cae a `localStorage`.** Dos límites ya contemplados en `services/storage/`: (1) `encryptionKey` **no existe en web** —pasarlo tira al crear la instancia—, así que el storage "seguro" ahí queda en **texto plano**; y (2) durante el render estático de expo-router (`web.output: "static"`, corre en Node) no hay `localStorage`, así que las lecturas devuelven `null` y las escrituras no hacen nada.
- 🔒 **Consecuencia de seguridad, ahora que web es un target:** el token de auth en web vive en `localStorage` sin encriptar y accesible desde JS. Antes de exponer la web a usuarios reales hay que decidir cómo se guarda la sesión ahí (cookie `httpOnly` desde el backend es lo habitual).
- ⚠️ **MMKV tiene código nativo → no funciona en Expo Go.** El desarrollo se hace con un **development build** (`npx expo run:android` / `run:android` local, o un build `development` de EAS instalado en el dispositivo). Nunca se prueba esta app dentro de la app cliente "Expo Go".

---

## 🛠️ Stack técnico

| Capa | Herramienta |
|---|---|
| Lenguaje | **TypeScript** (obligatorio, sin `any`) |
| Framework / tooling | **Expo (managed / CNG)** — SDK, Metro, EAS Build |
| Estado global / cliente | **Redux Toolkit** |
| Estado del servidor | **RTK Query** |
| Estado local | `useState` / `useReducer` |
| Formularios | **React Hook Form** |
| Validación | **Zod** (+ `@hookform/resolvers/zod`) |
| Navegación | **expo-router** (file-based, construido sobre React Navigation) |
| HTTP | **RTK Query** (`fetchBaseQuery`) — **sin axios** |
| Storage local | **MMKV** (requiere development build, no corre en Expo Go) |
| Estilos | **StyleSheet** + theme (tokens primitivos/semánticos, `useTheme()`) |
| Variables de entorno | `app.config.ts` (`extra`) + `expo-constants`, o `EXPO_PUBLIC_*` env vars |

Peer deps de navegación (ya instaladas): `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets`.

> ⚠️ **No instales ni importes `@react-navigation/*` directamente.** Desde el SDK 56, expo-router dejó de aceptar imports de `@react-navigation/*` desde código de aplicación: todo (`Stack`, `useNavigation`, `ThemeProvider`, `useRoute`, tipos `NativeStack*`) se importa desde `expo-router`.

Cualquier librería con código nativo (MMKV, gesture-handler, reanimated, svg, etc.) necesita entrar como **config plugin** si lo requiere, y siempre se instala con `npx expo install <paquete>` (no `npm install`) para que Expo resuelva la versión compatible con el SDK actual.

---

## ⌨️ Comandos importantes

```bash
# Levantar Metro / dev server
npx expo start

# Development build local (genera android/ios efímeros vía prebuild y corre en el device/emulador)
npx expo run:android
npx expo run:ios

# Regenerar la carpeta nativa manualmente a partir de app.json/app.config.ts (no se commitea)
npx expo prebuild --clean

# Instalar una dependencia (SIEMPRE así, no npm install a mano)
npx expo install <paquete>

# Builds en la nube con EAS
eas build --platform android --profile development
eas build --platform android --profile production

# Recargar la app: presionar 'r' en la terminal de Expo, o shake + "Reload" en el device
```

---

## ✍️ Convenciones de código

- **Componentes / Screens:** `PascalCase` → `LoginScreen.tsx`, `Button.tsx`
- **Hooks:** `camelCase` con prefijo `use` → `useLogin.ts`
- **Slices de Redux:** `<feature>Slice.ts`
- **API slices RTK Query:** `<feature>Api.ts` (vía `injectEndpoints` sobre el `baseApi`)
- **Tipos:** `PascalCase`. Preferir **inferir** los tipos desde los schemas de Zod.
- **Path aliases** (`@/features`, `@/shared`, `@/theme`, etc.). ❌ Nada de imports relativos largos (`../../../`).
  Los resuelve **Metro nativamente** desde los `paths` de `tsconfig.json` (`experiments.tsconfigPaths`, activo por default). ❌ **No agregues `babel-plugin-module-resolver` ni un `babel.config.js`**: no hacen falta y duplicar la resolución rompe el build. Si tocás los `paths`, reiniciá Expo CLI.
- Validar **siempre** las respuestas de la API con **Zod**.

---

## ✅ Reglas para Claude (importante)

1. **Trabajá siempre en una rama nueva** (`git checkout -b feature/...`). Nunca commitees directo a `main`.
2. **No modifiques `package.json` a mano** → usá `npx expo install <paquete>` (no `npm install`, para respetar la versión del SDK de Expo).
3. **Respetá la estructura por features.** Antes de crear un archivo, decidí en qué feature (o en `shared/`) va.
4. **Nunca** pongas lógica de negocio ni llamadas a la API dentro de un screen.
5. **Componentes de UI:** si lo usa toda la app → `shared/ui/atoms/` (sin lógica de negocio, todo por props). Si lo usa una sola feature → `features/<feature>/components/`. **No crees `molecules/` ni `organisms/` en `shared/`.**
6. **Estilos** con StyleSheet + tokens del theme vía `useTheme()`. Usar solo tokens semánticos, nunca primitivos ni valores hardcodeados.
7. **Storage** siempre vía `storageService`. Nunca MMKV directo. Recordá que requiere development build (no Expo Go).
8. **Estado:** servidor con RTK Query, cliente con slices de Redux, local con `useState`. No mezclar.
9. **Pantalla con datos de la API = pantalla que se refresca tirando para abajo**, con `useRefrescar` y el `refrescar` del hook de la feature. No te olvides de esto al crear un apartado nuevo.
10. **TypeScript siempre**, sin `any`. Usá path aliases, no imports relativos largos.
11. **Responsive por ancho, no por plataforma.** Toda pantalla envuelve su contenido en `<Container>`. Para layouts que cambian de forma, `useBreakpoint()`. ❌ Nunca `Platform.OS === 'web'` para decidir layout.
12. **Nunca edites `android/` ni `ios/` a mano** ni las commitees: toda config nativa (ícono, splash, permisos, plugins) va en `app.json` / `app.config.ts`. Para propiedades de Gradle que Expo no expone, está el config plugin local [`plugins/withPropiedadesGradle.js`](plugins/withPropiedadesGradle.js), declarado en `app.json` (así sobreviven al `prebuild`). Si una librería exige un cambio nativo que no se puede resolver por config plugin, avisá antes de hacer eject o mover el proyecto a bare workflow.
13. **Antes de instalar una librería nueva**, avisá y explicá por qué, y confirmá si necesita development build (código nativo) o corre en Expo Go.
14. Mensajes de commit con convención: `feat:`, `fix:`, `chore:`, `refactor:`.
15. Si una tarea puede **romper algo**, explicá el cambio y esperá confirmación antes de aplicarlo.

---

## 📌 Desvíos respecto de la plantilla (`.claude/CLAUDE-EXPO.md`)

Decisiones tomadas en el bootstrap que se apartan de la plantilla original. Son
**intencionales**; este archivo es la fuente de verdad.

| Tema | Plantilla | Este proyecto | Por qué |
|---|---|---|---|
| Navegación | React Navigation manual (`NavigationContainer` + Native Stack) | **expo-router** (file-based) | El proyecto se creó con la plantilla expo-router del SDK 57 y se decidió conservarla. |
| Entry point | `index.js` + `App.tsx` con `registerRootComponent` | **`expo-router/entry`** (campo `main` de `package.json`) | Lo exige expo-router. El rol de `App.tsx` lo cumple `src/app/_layout.tsx`. |
| Providers | `src/app/providers/` | **`src/providers/`** | En expo-router, todo lo que vive en `src/app/` se vuelve una ruta. |
| Navegadores | `src/app/navigation/` | *(no existe)* | La navegación **es** el árbol de archivos de `src/app/`. |
| Path aliases | `babel-plugin-module-resolver` + `babel.config.js` | **`tsconfig.json` a secas** | Metro resuelve los `paths` de forma nativa desde el SDK 50. El plugin es innecesario y duplicarlo rompe el build. |
| MMKV | `new MMKV()` / `delete()` (v3) | **`createMMKV()` / `remove()`** (v4) | `npx expo install` trae MMKV v4, que es un Nitro Module con otra API. |

## ✅ Qué quedó montado en el bootstrap

- `src/config/` — `API_BASE_URL` desde `EXPO_PUBLIC_*` (+ `.env` y `.env.example`).
- `src/services/storage/` — MMKV general + instancia encriptada, detrás de `storageService` / `secureStorageService`.
- `src/theme/` — tokens primitivos y semánticos, `ThemeProvider`, `useTheme()`, `useThemeMode()`, modo claro/oscuro persistido.
- `src/services/api/baseApi.ts` — RTK Query con `Authorization: Bearer` automático desde el storage seguro.
- `src/store/` — `configureStore` + `useAppDispatch` / `useAppSelector` tipados.
- `src/providers/AppProviders.tsx` — GestureHandler → SafeArea → Redux → Theme.
- `src/app/_layout.tsx` — layout raíz: providers + `<Stack>`, con el chrome del navegador tomando los tokens del theme.
- `src/shared/hooks/useRefrescar.tsx` — el gesto de refresco de la regla 9.
- `src/shared/ui/atoms/` — `Text`, `Button`, `Input`, `InputField`, `Badge`, `Modal`, `Container`.
- `src/features/auth/` — login, registro y recuperar contraseña (RHF + Zod + RTK Query).
- `src/features/design-system/` — catálogo vivo, con el botón flotante 🎨.
- `src/shared/hooks/useBreakpoint.ts` — el responsive por ancho de ventana.
- Fuentes Inter + Poppins embebidas vía config plugin de `expo-font`.
- `plugins/withPropiedadesGradle.js` — topes de memoria de Gradle, resistentes al `prebuild`.
- ESLint (`eslint-config-expo` + Prettier al final) y Prettier.

## ⏳ Decisiones pendientes (requieren tu OK — regla 12)

- **`react-native-svg-transformer`** — hace falta para importar SVG como componentes (lo pide la sección de Assets). No se instaló: suma una dependencia y un `metro.config.js`.
- **`expo-secure-store`** — hoy la `encryptionKey` del storage seguro sale de una variable `EXPO_PUBLIC_*`, o sea que **viaja en texto plano dentro del bundle**. Para producción la clave debería generarse en el device y guardarse en el Keychain/Keystore.
