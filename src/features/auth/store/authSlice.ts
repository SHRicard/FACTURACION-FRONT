import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/store';

import type { Sesion, Usuario } from '../types';

type AuthState = {
  usuario: Usuario | null;
  token: string | null;
};

const estadoInicial: AuthState = {
  usuario: null,
  token: null,
};

/**
 * Estado de CLIENTE de la sesion (quien esta logueado).
 * Los datos que vienen del servidor los maneja RTK Query, no este slice.
 *
 * Los reducers son puros a proposito: escribir el token en el storage seguro es
 * un efecto y vive en el hook `useLogin`, no aca.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState: estadoInicial,
  reducers: {
    sesionIniciada: (estado, accion: PayloadAction<Sesion>) => {
      estado.usuario = accion.payload.usuario;
      estado.token = accion.payload.token;
    },
    sesionCerrada: (estado) => {
      estado.usuario = null;
      estado.token = null;
    },
  },
});

export const { sesionIniciada, sesionCerrada } = authSlice.actions;
export const authReducer = authSlice.reducer;

// Selectores: las pantallas leen de aca, no del shape crudo del store.
export const selectUsuario = (estado: RootState) => estado.auth.usuario;
export const selectEstaAutenticado = (estado: RootState) => estado.auth.token !== null;
