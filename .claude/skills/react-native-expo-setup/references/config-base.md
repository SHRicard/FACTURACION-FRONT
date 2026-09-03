# Referencia: Config base (Expo)

Archivos de configuración que conectan el stack y dejan la app lista para codear features. Seguí el orden: cada parte depende de la anterior.

> Nota de versión MMKV: los ejemplos usan `new MMKV()` (v3). MMKV v4 usa `createMMKV()`. Ajustá esa línea según la versión instalada; el resto no cambia.
> Nota Expo: MMKV tiene código nativo → **no corre en Expo Go**. Probá siempre en un development build (`npx expo run:android` o un build `development` de EAS).

## Orden

1. Path aliases (`@/`)
2. Config / variables de entorno
3. Storage (MMKV + storageService)
4. Theme (ver skill `react-native-expo-theme`)
5. RTK Query baseApi
6. Redux store
7. Providers raíz
8. Navegación
9. Wiring final (`App.tsx` + `index.js`)

---

## 1. Path aliases

Necesita un paquete extra. No es una librería nativa ligada al SDK de Expo, así que se instala con `npm`, no con `expo install`:

```bash
npm install --save-dev babel-plugin-module-resolver
```

**`tsconfig.json`** (en la raíz) → para que TypeScript entienda los `@/`. La plantilla de Expo ya trae `expo/tsconfig.base`, solo se le suman los paths:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "baseUrl": ".",
    "strict": true,
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**`babel.config.js`** → para que Metro resuelva los `@/` en runtime:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: { '@': './src' },
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        },
      ],
      // ⚠️ Ver nota de Reanimated/worklets abajo antes de agregar el plugin acá.
    ],
  };
};
```

> ⚠️ **Reanimated/worklets en Expo:** desde `babel-preset-expo` v11 (SDK 50+), el preset **ya agrega automáticamente** el plugin de Reanimated/worklets cuando detecta `react-native-reanimated` instalado. Si lo agregás también a mano en `plugins`, vas a tener el plugin duplicado y falla el build. Agregalo manualmente **solo** si tu versión de `babel-preset-expo` es anterior a la v11 — en ese caso va **siempre último** en el array, como `'react-native-worklets/plugin'` (Reanimated 3.16+) o `'react-native-reanimated/plugin'` (versiones previas).

---

## 2. Config / variables de entorno

Expo inlinea automáticamente (desde el SDK 49) cualquier variable de entorno con prefijo `EXPO_PUBLIC_` en el bundle — no hace falta `react-native-config` ni nada extra. Ojo: quedan **visibles en el cliente**, nunca pongas ahí secretos.

```bash
# .env (raíz del proyecto, no se commitea si tiene datos sensibles de ambiente)
EXPO_PUBLIC_API_BASE_URL=https://tu-api.com
```

```ts
// src/config/index.ts
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://tu-api.com';
```

> Alternativa cuando el valor depende del build profile de EAS (dev/preview/prod) en vez de un `.env` por ambiente: definirlo en `app.config.ts` bajo `extra` y leerlo con `expo-constants` (`Constants.expoConfig?.extra?.apiBaseUrl`).

---

## 3. Storage (MMKV + storageService)

```ts
// src/services/storage/mmkv.ts
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV(); // v4: createMMKV()
```

```ts
// src/services/storage/keys.ts
export const StorageKeys = {
  AUTH_TOKEN: 'auth_token',
  THEME_MODE: 'theme_mode',
} as const;
```

```ts
// src/services/storage/storageService.ts
import { storage } from './mmkv';

export const storageService = {
  set<T>(key: string, value: T): void {
    storage.set(key, JSON.stringify(value));
  },
  get<T>(key: string): T | null {
    const v = storage.getString(key);
    return v ? (JSON.parse(v) as T) : null;
  },
  setString(key: string, value: string): void {
    storage.set(key, value);
  },
  getString(key: string): string | null {
    return storage.getString(key) ?? null;
  },
  remove(key: string): void {
    storage.delete(key);
  },
  clearAll(): void {
    storage.clearAll();
  },
};
```

> Regla: toda la app accede al storage vía `storageService`, **nunca** a `storage` (MMKV) directo. Y recordá: esta capa no funciona dentro de la app "Expo Go" — necesita development build.

---

## 4. Theme

El theme se monta siguiendo el skill **`react-native-expo-theme`** (tokens primitivos/semánticos, `ThemeProvider`, `useTheme`). No lo dupliques acá: armalo según ese skill, con tus colores reales.

---

## 5. RTK Query baseApi

La base de datos del servidor. Las features inyectan sus endpoints acá vía `injectEndpoints`.

```ts
// src/services/api/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '@/config';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  endpoints: () => ({}), // vacío: las features inyectan acá
});
```

---

## 6. Redux store

```ts
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import { baseApi } from '@/services/api/baseApi';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    // slices de features se agregan acá
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks tipados (usar SIEMPRE estos, no los crudos de react-redux)
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## 7. Providers raíz

Centraliza todos los providers globales en un solo lugar.

```tsx
// src/app/providers/AppProviders.tsx
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ThemeProvider } from '@/theme';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider>{children}</ThemeProvider>
    </Provider>
  );
}
```

---

## 8. Navegación

React Navigation funciona igual en Expo que en RN CLI (no es `expo-router`: este stack usa navegación manual con Native Stack).

```tsx
// src/app/navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* ⚠️ Agregá al menos una screen, o el navegador falla.
            Ej: <Stack.Screen name="Home" component={HomeScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 9. Wiring final

**`App.tsx`** (raíz del proyecto) → arma todo el árbol. Es igual que en RN CLI:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProviders } from '@/app/providers/AppProviders';
import { RootNavigator } from '@/app/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders>
          <RootNavigator />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

**`index.js`** (raíz) → en Expo el entry point registra el componente raíz con `registerRootComponent` (maneja tanto Expo Go como un standalone/dev build correctamente; internamente llama a `AppRegistry.registerComponent` por vos). `react-native-gesture-handler` sigue yendo en la **primera línea**:

```js
import 'react-native-gesture-handler'; // 👈 PRIMERA línea, antes que nada
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

Y en `package.json`, apuntar `main` a este archivo (reemplaza el default `"expo/AppEntry.js"` que trae la plantilla):

```json
{
  "main": "index.js"
}
```

---

## Verificación final

```bash
npx expo start --clear     # Metro con cache limpia
npx expo run:android        # debería compilar y abrir la app (development build)
```

Si compila y abre (aunque sea una pantalla vacía), la config base está OK y el proyecto queda listo para crear features.
