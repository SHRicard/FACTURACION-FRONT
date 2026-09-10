# CLAUDE-EXPO.md

> Frontend de una app móvil en **React Native con Expo** (managed workflow / CNG — Continuous Native Generation), New Architecture.
> Este archivo define la **arquitectura, el stack y las reglas de cómo programar**. Seguilas en cada tarea.
> Este repo es **solo frontend**: consume una API REST que vive en otro proyecto. No maneja base de datos ni ORM.
>
> Es la versión adaptada a Expo de `CLAUDE.md` (React Native CLI puro). La arquitectura y las capas son las mismas; lo que cambia es el tooling nativo: build, assets, config y comandos.

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
├── app/
│   ├── navigation/          # Navegadores (Native Stack, tabs)
│   └── providers/           # Redux <Provider>, ThemeProvider
│
├── features/                # Una carpeta por funcionalidad
│   └── <feature>/
│       ├── components/      # 🧩 Composiciones SOLO de esta feature
│       ├── screens/         # Pantallas de la feature
│       │   ├── XScreen.tsx  #   Índice: elige la vista según el ancho (useEsEscritorio)
│       │   ├── movil/       #   📱 Vista de teléfono: lo que se desarrolla hoy
│       │   └── escritorio/  #   🖥️ Vista de escritorio (ver "Móvil y escritorio")
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
└── config/                   # Variables de entorno + URL base de la API (vía expo-constants / app.config.ts)
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

## 📱 Móvil y escritorio

Lo que se está desarrollando hoy es **la vista móvil**. La de escritorio va a ser una composición **completamente distinta** —sidebar en vez de tabs, tablas en vez de tarjetas, ficha al lado de la lista en vez de una pantalla nueva—, no la misma estirada. Está para el final del proyecto.

### La regla

**El corte lo decide el ANCHO DE VENTANA, nunca `Platform.OS`.**

Una tablet nativa en horizontal es escritorio; un celular abierto en el navegador es móvil. Partir por plataforma se equivoca en los dos casos, y los dos pasan de verdad en un negocio que factura desde el mostrador. `Platform` queda para lo que sí es de la plataforma: teclado, fuentes y storage.

El umbral es **uno solo para toda la app**: `breakpointEscritorio` (`lg`, 905px) en `theme/tokens/layout.ts`. Se pregunta con **`useEsEscritorio()`**.

### Las tres herramientas, en orden

1. **`Container ancho="formulario" | "contenido" | "ancho"`** — el tope de ancho. Un formulario con tope 440 ya se ve bien en un monitor sin tocar nada.
2. **`useBreakpoint().elegir({ sm, md, lg, xl })`** — para **números**: columnas, anchos, paddings. Ver `DashboardScreen`.
3. **`useEsEscritorio()`** — para **composiciones distintas**. Es la última opción, porque duplica presentación.

### Cuándo bifurcar (usar la 3)

Solo si cambia el **árbol**, no si cambian los **números**. Tres preguntas; si las tres dan "no", no se bifurca:

1. ¿Cambia **qué** componentes hay? (tarjeta → fila de tabla)
2. ¿Cambia el **anidado**? (dos pantallas → dos paneles lado a lado)
3. ¿Cambia la **interacción**? (tap → hover y selección; tirar para abajo → botón de refrescar)

Si solo cambian anchos, columnas o espaciados → herramientas 1 y 2, cero archivos nuevos.

### Qué se comparte y qué se duplica

- **Siempre compartido, nunca se duplica:** `api/`, `hooks/`, `schemas.ts`, `types.ts`, `store/`, `navegar.ts`, `shared/utils/`, el theme y los atoms de contenido (`Text`, `Button`, `Input`, `Badge`, `Modal`, `EstadoVacio`). Si el escritorio necesita otros datos, es un **hook nuevo en la misma carpeta**, no una copia de la feature.
- **Compartido hasta que no alcance:** `components/` de la feature. El día que la vista de escritorio necesita otra pieza, la nueva va a `components/escritorio/`.
- **Móvil-first, van a necesitar hermano:** `Pantalla` (asume barra de tabs abajo y flecha de volver, dos cosas que en escritorio no existen) y las screens que cumplan el criterio de arriba.

### La forma de una feature bifurcada

```
screens/
├── index.ts                     # el barril NO cambia: sigue exportando XScreen
├── ClientesScreen.tsx           # el índice condicional: solo elige, 3 líneas
├── movil/ClientesMovil.tsx      # lo que hay hoy
└── escritorio/ClientesEscritorio.tsx
```

El índice es literalmente esto, y no hace nada más:

```tsx
export function ClientesScreen() {
  return useEsEscritorio() ? <ClientesEscritorio /> : <ClientesMovil />;
}
```

> Las 11 pantallas del área de administrador ya están con esta forma, con la de escritorio en `EnConstruccion`. Las de **auth** y el **design system** quedaron sin bifurcar a propósito: un formulario centrado y un catálogo de dos columnas ya funcionan en las dos, y poner un cartel de "en construcción" en el login dejaría la app sin poder entrarse desde una ventana ancha.

### Cuando llegue el escritorio

- La navegación **no se bifurca por archivo**: `expo-router/ui` trae tabs headless (`Tabs`, `TabSlot`, `TabList`, `TabTrigger`) y el mismo navegador dibuja el `TabList` abajo en móvil o a la izquierda en escritorio.
- ⚠️ Un navegador (`<Stack>`, `<Tabs>`) tiene que quedar **siempre en la misma posición del árbol de React**. Si cambia de padre al cruzar el umbral, React lo desmonta y se pierde el historial.
- `app.json` tiene `web.output: "static"`: durante el prerender no hay DOM y el ancho de ventana llega en `0`, así que el HTML estático sale siempre con la vista móvil y el cliente la reemplaza al hidratar. Cuando el escritorio sea real, pasarlo a `"single"` — es una app detrás de un login, no hay SEO que perder.
- `app.json` tiene `orientation: "portrait"`, así que hoy ningún teléfono nativo llega a 905px. El umbral solo lo cruzan tablets y el navegador.

---

## 🗄️ Storage local

- **MMKV** (`react-native-mmkv`) — síncrono, rápido.
- Siempre se accede vía `services/storage/storageService`. ❌ **Nunca usar la instancia MMKV directo** en componentes o features.
- Token de auth → instancia MMKV **encriptada** (`encryptionKey`), separada del storage general.
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
| Navegación | **React Navigation** (Native Stack) |
| HTTP | **RTK Query** (`fetchBaseQuery`) — **sin axios** |
| Storage local | **MMKV** (requiere development build, no corre en Expo Go) |
| Estilos | **StyleSheet** + theme (tokens primitivos/semánticos, `useTheme()`) |
| Variables de entorno | `app.config.ts` (`extra`) + `expo-constants`, o `EXPO_PUBLIC_*` env vars |

Peer deps de React Navigation (se instalan una vez, vía `npx expo install`): `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated`.

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
11. **Nunca edites `android/` ni `ios/` a mano** ni las commitees: toda config nativa (ícono, splash, permisos, plugins) va en `app.json` / `app.config.ts`. Si una librería exige un cambio nativo que no se puede resolver por config plugin, avisá antes de hacer eject o mover el proyecto a bare workflow.
12. **Antes de instalar una librería nueva**, avisá y explicá por qué, y confirmá si necesita development build (código nativo) o corre en Expo Go.
13. Mensajes de commit con convención: `feat:`, `fix:`, `chore:`, `refactor:`.
14. Si una tarea puede **romper algo**, explicá el cambio y esperá confirmación antes de aplicarlo.
15. **Lo que se desarrolla hoy es la vista MÓVIL.** Todo cambio de pantalla va en `screens/movil/`; la de escritorio queda en `EnConstruccion` hasta su etapa. El corte lo decide el ancho con `useEsEscritorio()`, **nunca** `Platform.OS`. Antes de bifurcar una pantalla nueva, fijate si no alcanza con `Container` + `elegir()` (ver "📱 Móvil y escritorio").
