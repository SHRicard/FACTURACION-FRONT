import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { VERSION_APP } from '@/config';
import { compararVersiones } from '@/shared/utils';
import type { RootState } from '@/store';

import { actualizacionApi } from '../api/actualizacionApi';

/**
 * A dónde manda "Actualizar" si el back no dijo otra cosa. Es la misma que usa
 * el back por defecto (APP_URL_TIENDA).
 */
const URL_TIENDA_POR_DEFECTO = 'https://play.google.com/store/apps/details?id=io.rrdev.facturacion';

type ActualizacionState = {
  /** Esta versión quedó por debajo de la mínima: la app no se puede usar. */
  desactualizada: boolean;
  minima: string | null;
  /** Hay una versión más nueva publicada, pero esta todavía sirve. */
  hayNueva: boolean;
  /**
   * La persona tocó "Ahora no" en el aviso de versión nueva. NO se persiste a
   * propósito: el aviso vuelve en el próximo arranque.
   */
  avisoDescartado: boolean;
  urlTienda: string;
};

const estadoInicial: ActualizacionState = {
  desactualizada: false,
  minima: null,
  hayNueva: false,
  avisoDescartado: false,
  urlTienda: URL_TIENDA_POR_DEFECTO,
};

/**
 * Si esta versión de la app se puede seguir usando (K8).
 *
 * Se entera por dos lados: el `/app/version` del arranque (por el matcher) y
 * cualquier 426 APP_DESACTUALIZADA de la API (por `actualizacionMiddleware`).
 * Es puro: `VERSION_APP` es una constante del bundle.
 */
const actualizacionSlice = createSlice({
  name: 'actualizacion',
  initialState: estadoInicial,
  reducers: {
    /** Un 426 de cualquier ruta. Los datos pisan los que había solo si vienen. */
    appDesactualizada: (
      estado,
      accion: PayloadAction<{ minima: string | null; urlTienda: string | null }>,
    ) => {
      estado.desactualizada = true;
      if (accion.payload.minima) estado.minima = accion.payload.minima;
      if (accion.payload.urlTienda) estado.urlTienda = accion.payload.urlTienda;
    },

    /** "Ahora no" en el aviso de versión nueva. */
    avisoActualizacionDescartado: (estado) => {
      estado.avisoDescartado = true;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      actualizacionApi.endpoints.versionApp.matchFulfilled,
      (estado, { payload }) => {
        estado.minima = payload.minima;
        estado.urlTienda = payload.urlTienda ?? estado.urlTienda;

        // Sin versión propia no hay con qué comparar: no se bloquea ni se avisa.
        if (!VERSION_APP) return;

        // Un 426 ya visto no se deshace: el back lo sabe mejor que este cálculo.
        estado.desactualizada =
          estado.desactualizada || compararVersiones(VERSION_APP, payload.minima) === -1;
        estado.hayNueva =
          payload.ultima !== null && compararVersiones(VERSION_APP, payload.ultima) === -1;
      },
    );
  },
});

export const { appDesactualizada, avisoActualizacionDescartado } = actualizacionSlice.actions;
export const actualizacionReducer = actualizacionSlice.reducer;

export const selectActualizacion = (estado: RootState) => estado.actualizacion;
