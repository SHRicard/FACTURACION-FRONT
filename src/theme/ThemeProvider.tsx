import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { StorageKeys, storageService } from '@/services/storage';

import { darkTheme } from './themes/darkTheme';
import { lightTheme } from './themes/lightTheme';
import type { ColorScheme, Theme, ThemeMode } from './types';

type ThemeContextValue = {
  /** Tokens semanticos del esquema activo. */
  theme: Theme;
  /** Preferencia del usuario: 'light' | 'dark' | 'system'. */
  mode: ThemeMode;
  /** Esquema que se esta renderizando de verdad (resuelve 'system'). */
  colorScheme: ColorScheme;
  /** Fija la preferencia y la persiste. */
  setMode: (mode: ThemeMode) => void;
  /** Alterna entre claro y oscuro (util para un switch de Ajustes). */
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readPersistedMode(): ThemeMode {
  const stored = storageService.getString(StorageKeys.THEME_MODE);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // MMKV es sincrono: se puede leer la preferencia en el primer render, sin flash.
  const [mode, setModeState] = useState<ThemeMode>(readPersistedMode);
  const systemScheme = useColorScheme();

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    storageService.setString(StorageKeys.THEME_MODE, next);
  }, []);

  // `useColorScheme()` puede devolver null/undefined (y 'unspecified' en algunas
  // plataformas): cualquier cosa que no sea 'dark' cae en claro.
  const systemColorScheme: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light';
  const colorScheme: ColorScheme = mode === 'system' ? systemColorScheme : mode;

  const toggleMode = useCallback(() => {
    setMode(colorScheme === 'dark' ? 'light' : 'dark');
  }, [colorScheme, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: colorScheme === 'dark' ? darkTheme : lightTheme,
      mode,
      colorScheme,
      setMode,
      toggleMode,
    }),
    [colorScheme, mode, setMode, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(hook: string): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error(`${hook} tiene que usarse dentro de <ThemeProvider>`);
  return ctx;
}

/** Unica forma en que un componente accede al theme. */
export function useTheme(): Theme {
  return useThemeContext('useTheme').theme;
}

/** Para leer/cambiar el modo (ej. el switch de modo oscuro en Ajustes). */
export function useThemeMode() {
  const { mode, colorScheme, setMode, toggleMode } = useThemeContext('useThemeMode');
  return { mode, colorScheme, setMode, toggleMode };
}
