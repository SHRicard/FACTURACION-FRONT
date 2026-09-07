import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { SecureStorageKeys, secureStorageService } from '@/services/storage';
import type { RootState } from '@/store';

import type { Sesion, Usuario } from '../types';

/**
 * `verificando` es el estado del arranque: hay un token guardado de una sesion
 * anterior pero todavia no sabemos si el backend lo sigue aceptando. Dura lo
 * que tarda el `/auth/me`. Existe para no mandar a login a alguien que SI tiene
 * la sesion abierta, que es lo que pasaba mientras el store arrancaba vacio.
 */
type EstadoArranque = 'verificando' | 'listo';

type AuthState = {
  usuario: Usuario | null;
  token: string | null;
  arranque: EstadoArranque;
};

/**
 * El token se lee del storage de forma SINCRONICA (MMKV lo permite) para que el
 * primer render ya sepa si hay algo que verificar. Si se leyera en un efecto
 * habria un frame con la sesion vacia y la app pegaria un salto a /login antes
 * de volver.
 */
const tokenGuardado = secureStorageService.getString(SecureStorageKeys.AUTH_TOKEN);

const estadoInicial: AuthState = {
  usuario: null,
  token: tokenGuardado,
  arranque: tokenGuardado ? 'verificando' : 'listo',
};

/**
 * Estado de CLIENTE de la sesion (quien esta logueado).
 * Los datos que vienen del servidor los maneja RTK Query, no este slice.
 *
 * Los reducers son puros a proposito: escribir el token en el storage seguro es
 * un efecto y vive en los hooks de la feature, no aca.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState: estadoInicial,
  reducers: {
    sesionIniciada: (estado, accion: PayloadAction<Sesion>) => {
      estado.usuario = accion.payload.usuario;
      estado.token = accion.payload.token;
      estado.arranque = 'listo';
    },

    /** El `/auth/me` del arranque dijo que el token guardado sigue valiendo. */
    sesionRestaurada: (estado, accion: PayloadAction<Usuario>) => {
      estado.usuario = accion.payload;
      estado.arranque = 'listo';
    },

    sesionCerrada: (estado) => {
      estado.usuario = null;
      estado.token = null;
      estado.arranque = 'listo';
    },
  },
});

export const { sesionIniciada, sesionRestaurada, sesionCerrada } = authSlice.actions;
export const authReducer = authSlice.reducer;

// Selectores: las pantallas leen de aca, no del shape crudo del store.
export const selectUsuario = (estado: RootState) => estado.auth.usuario;
export const selectToken = (estado: RootState) => estado.auth.token;

/**
 * Hay sesion usable cuando conocemos al usuario, no cuando hay un token: un
 * token vencido en el storage tambien es un token.
 */
export const selectEstaAutenticado = (estado: RootState) => estado.auth.usuario !== null;

/** Mientras sea false no se puede decidir si mandar a login o a la home. */
export const selectSesionVerificada = (estado: RootState) => estado.auth.arranque === 'listo';
