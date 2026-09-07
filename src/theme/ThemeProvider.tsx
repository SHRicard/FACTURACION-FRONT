import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { StorageKeys, storageService } from '@/services/storage';

import { darkTheme } from './themes/darkTheme';
import { lightTheme } from './themes/lightTheme';
import {
  ESTILO_CABECERA_POR_DEFECTO,
  ESTILO_TABS_POR_DEFECTO,
  PAR_TIPOGRAFICO_POR_DEFECTO,
  esClaveEstiloCabecera,
  esClaveEstiloTabs,
  esClaveParTipografico,
  estilosCabecera,
  estilosTabs,
  paresTipograficos,
  type ClaveEstiloCabecera,
  type ClaveEstiloTabs,
  type ClaveParTipografico,
} from './tokens';
import type { ColorScheme, Theme, ThemeMode } from './types';

type ThemeContextValue = {
  /** Tokens del esquema activo, con la tipografia elegida ya aplicada. */
  theme: Theme;
  /** Preferencia de modo: 'light' | 'dark' | 'system'. */
  mode: ThemeMode;
  /** Esquema que se esta renderizando de verdad (resuelve 'system'). */
  colorScheme: ColorScheme;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  /** Par tipografico activo. */
  parTipografico: ClaveParTipografico;
  setParTipografico: (par: ClaveParTipografico) => void;
  /** Estilo de la barra de tabs activo. */
  estiloTabs: ClaveEstiloTabs;
  setEstiloTabs: (estilo: ClaveEstiloTabs) => void;
  /** Estilo de la cabecera de las pantallas de detalle. */
  estiloCabecera: ClaveEstiloCabecera;
  setEstiloCabecera: (estilo: ClaveEstiloCabecera) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function leerModoPersistido(): ThemeMode {
  const guardado = storageService.getString(StorageKeys.THEME_MODE);
  return guardado === 'light' || guardado === 'dark' || guardado === 'system' ? guardado : 'system';
}

function leerParPersistido(): ClaveParTipografico {
  const guardado = storageService.getString(StorageKeys.PAR_TIPOGRAFICO);
  return esClaveParTipografico(guardado) ? guardado : PAR_TIPOGRAFICO_POR_DEFECTO;
}

function leerEstiloTabsPersistido(): ClaveEstiloTabs {
  const guardado = storageService.getString(StorageKeys.ESTILO_TABS);
  return esClaveEstiloTabs(guardado) ? guardado : ESTILO_TABS_POR_DEFECTO;
}

function leerEstiloCabeceraPersistido(): ClaveEstiloCabecera {
  const guardado = storageService.getString(StorageKeys.ESTILO_CABECERA);
  return esClaveEstiloCabecera(guardado) ? guardado : ESTILO_CABECERA_POR_DEFECTO;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // MMKV es sincrono: se leen las preferencias en el primer render, sin flash.
  const [mode, setModeState] = useState<ThemeMode>(leerModoPersistido);
  const [parTipografico, setParState] = useState<ClaveParTipografico>(leerParPersistido);
  const [estiloTabs, setEstiloTabsState] = useState<ClaveEstiloTabs>(leerEstiloTabsPersistido);
  const [estiloCabecera, setEstiloCabeceraState] = useState<ClaveEstiloCabecera>(
    leerEstiloCabeceraPersistido,
  );
  const systemScheme = useColorScheme();

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    storageService.setString(StorageKeys.THEME_MODE, next);
  }, []);

  const setParTipografico = useCallback((next: ClaveParTipografico) => {
    setParState(next);
    storageService.setString(StorageKeys.PAR_TIPOGRAFICO, next);
  }, []);

  const setEstiloTabs = useCallback((next: ClaveEstiloTabs) => {
    setEstiloTabsState(next);
    storageService.setString(StorageKeys.ESTILO_TABS, next);
  }, []);

  const setEstiloCabecera = useCallback((next: ClaveEstiloCabecera) => {
    setEstiloCabeceraState(next);
    storageService.setString(StorageKeys.ESTILO_CABECERA, next);
  }, []);

  // `useColorScheme()` puede devolver null/undefined (y 'unspecified' en algunas
  // plataformas): cualquier cosa que no sea 'dark' cae en claro.
  const systemColorScheme: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light';
  const colorScheme: ColorScheme = mode === 'system' ? systemColorScheme : mode;

  const toggleMode = useCallback(() => {
    setMode(colorScheme === 'dark' ? 'light' : 'dark');
  }, [colorScheme, setMode]);

  /**
   * El theme se COMPONE: el esquema de color decide los colores y el par
   * tipografico decide las familias. Los componentes no se enteran de nada de
   * esto: siguen pidiendo `theme.typography.family.text.bold` y reciben lo que
   * corresponda.
   */
  const theme = useMemo<Theme>(() => {
    const base = colorScheme === 'dark' ? darkTheme : lightTheme;
    return {
      ...base,
      typography: {
        ...base.typography,
        family: paresTipograficos[parTipografico].family,
      },
    };
  }, [colorScheme, parTipografico]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      colorScheme,
      setMode,
      toggleMode,
      parTipografico,
      setParTipografico,
      estiloTabs,
      setEstiloTabs,
      estiloCabecera,
      setEstiloCabecera,
    }),
    [
      theme,
      mode,
      colorScheme,
      setMode,
      toggleMode,
      parTipografico,
      setParTipografico,
      estiloTabs,
      setEstiloTabs,
      estiloCabecera,
      setEstiloCabecera,
    ],
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

/** Para leer/cambiar el modo claro-oscuro (ej. el switch de Ajustes). */
export function useThemeMode() {
  const { mode, colorScheme, setMode, toggleMode } = useThemeContext('useThemeMode');
  return { mode, colorScheme, setMode, toggleMode };
}

/**
 * Para el selector de tipografia: devuelve el par activo, el catalogo completo
 * y como cambiarlo. La eleccion se persiste.
 */
export function useTipografia() {
  const { parTipografico, setParTipografico } = useThemeContext('useTipografia');
  return { par: parTipografico, pares: paresTipograficos, setPar: setParTipografico };
}

/**
 * Estilo de la barra de tabs: la clave elegida, la geometria de ese estilo ya
 * resuelta y como cambiarlo. La eleccion se persiste.
 *
 * Lo usan la barra (para dibujarse) y la hoja del tour (para saber donde cae),
 * asi los dos leen exactamente los mismos numeros.
 */
export function useEstiloTabs() {
  const { estiloTabs, setEstiloTabs } = useThemeContext('useEstiloTabs');
  return {
    clave: estiloTabs,
    estilo: estilosTabs[estiloTabs],
    estilos: estilosTabs,
    setEstilo: setEstiloTabs,
  };
}

/**
 * Estilo de la cabecera de las pantallas de detalle: la clave elegida, la forma
 * de ese estilo ya resuelta y como cambiarlo. La eleccion se persiste.
 *
 * Lo usan `BarraVolver` (para saber que dibujar) y `Pantalla` (para saber si el
 * titulo grande le corresponde a ella o ya lo puso la barra).
 */
export function useEstiloCabecera() {
  const { estiloCabecera, setEstiloCabecera } = useThemeContext('useEstiloCabecera');
  return {
    clave: estiloCabecera,
    estilo: estilosCabecera[estiloCabecera],
    estilos: estilosCabecera,
    setEstilo: setEstiloCabecera,
  };
}
