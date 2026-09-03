import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
  type Theme as NavigationTheme,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';

import { BotonDesignSystem } from '@/features/design-system/components';
import { AppProviders } from '@/providers';
import { useTheme, useThemeMode } from '@/theme';

/**
 * Si algo revienta al renderizar, expo-router muestra ESTA pantalla de error en
 * vez de dejarte mirando el splash. Sin esto, cualquier throw en el arbol se ve
 * como una pantalla del color del splash (#208AEF) sin ninguna pista.
 */
export { ErrorBoundary } from 'expo-router';

// A proposito NO se llama a SplashScreen.preventAutoHideAsync(): no hay ninguna
// carga asincronica que esperar (MMKV es sincrono, el theme se resuelve en el
// primer render), y si se previene el auto-hide y algo falla antes de llamar a
// hideAsync(), el splash queda pegado y la app parece colgada.

/**
 * Layout raiz de expo-router. Es el equivalente al `App.tsx` de un proyecto con
 * React Navigation manual: aca van los providers globales y el navegador raiz.
 */
export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

/**
 * Navegador raiz. Va separado del layout porque necesita estar DENTRO del
 * ThemeProvider para poder leer los tokens con `useTheme()`.
 */
function RootNavigator() {
  const theme = useTheme();
  const { colorScheme } = useThemeMode();

  // El chrome del navegador (headers, fondos, transiciones) toma los mismos
  // tokens semanticos que el resto de la app: cero colores hardcodeados.
  const navigationTheme = useMemo<NavigationTheme>(() => {
    const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.error,
      },
    };
  }, [colorScheme, theme]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
      {/* Flota por encima de toda la app. Solo en __DEV__. */}
      <BotonDesignSystem />
    </NavigationThemeProvider>
  );
}
