import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { SecureStorageKeys, secureStorageService } from '@/services/storage';
import type { RootState } from '@/store';

import type { AvisoSesion, Pendiente, Sesion, Suspension, Usuario, UsuarioActual } from '../types';

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
  /**
   * Que le falta para usar la app: el DNI ('perfil') o la marca ('marca').
   * Mientras no sea null, la app no deja pasar de la bienvenida.
   */
  pendiente: Pendiente;
  /**
   * Aviso de una sola vez para la primera pantalla después de entrar (ej. la
   * cuenta quedó vinculada a Google). null = nada que avisar.
   */
  aviso: AvisoSesion | null;
  /**
   * La cuenta quedó suspendida (403 CUENTA_SUSPENDIDA). Sobrevive al cierre de
   * sesión a propósito: es lo que lee la pantalla a la que se manda después.
   */
  suspension: Suspension | null;
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
  pendiente: null,
  aviso: null,
  suspension: null,
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
      estado.pendiente = accion.payload.pendiente;
      estado.arranque = 'listo';
      estado.suspension = null;
    },

    /**
     * El usuario al dia, sin token nuevo: lo usan el `/auth/me` del arranque y
     * de los refrescos, y la carga del DNI, que responden la misma forma.
     */
    sesionRestaurada: (estado, accion: PayloadAction<UsuarioActual>) => {
      estado.usuario = accion.payload.usuario;
      estado.pendiente = accion.payload.pendiente;
      estado.arranque = 'listo';
    },

    /**
     * Cambio lo que le falta sin que haga falta pedir el usuario: creo su
     * marca, se fue de una, o un 403 del backend avisa que la perdio (otro
     * dueno lo saco).
     */
    pendienteActualizado: (estado, accion: PayloadAction<Pendiente>) => {
      estado.pendiente = accion.payload;
    },

    /**
     * Solo lo despacha `cerrarSesionLocal`, que además borra el token y vacía
     * la caché de RTK Query.
     */
    sesionCerrada: (estado) => {
      estado.usuario = null;
      estado.token = null;
      estado.pendiente = null;
      estado.aviso = null;
      estado.arranque = 'listo';
    },

    /**
     * Deja un aviso para la primera pantalla después de entrar. Va aparte de
     * `sesionIniciada` (que no lo toca) porque se despacha justo después, solo
     * cuando corresponde.
     */
    avisoDeSesionMostrado: (estado, accion: PayloadAction<AvisoSesion>) => {
      estado.aviso = accion.payload;
    },

    /** La persona cerró el aviso: no vuelve a aparecer. */
    avisoDeSesionVisto: (estado) => {
      estado.aviso = null;
    },

    /**
     * El backend respondió 403 CUENTA_SUSPENDIDA. Lo despacha el middleware
     * DESPUÉS de `cerrarSesionLocal`, que no lo borra.
     */
    cuentaSuspendida: (estado, accion: PayloadAction<Suspension>) => {
      estado.suspension = accion.payload;
    },

    /** La persona leyó el cartel y vuelve al login. */
    suspensionVista: (estado) => {
      estado.suspension = null;
    },
  },
});

export const {
  sesionIniciada,
  sesionRestaurada,
  pendienteActualizado,
  sesionCerrada,
  avisoDeSesionMostrado,
  avisoDeSesionVisto,
  cuentaSuspendida,
  suspensionVista,
} = authSlice.actions;
export const authReducer = authSlice.reducer;

// Selectores: las pantallas leen de aca, no del shape crudo del store.
export const selectUsuario = (estado: RootState) => estado.auth.usuario;
export const selectToken = (estado: RootState) => estado.auth.token;
export const selectPendiente = (estado: RootState) => estado.auth.pendiente;
export const selectAvisoSesion = (estado: RootState) => estado.auth.aviso;
export const selectSuspension = (estado: RootState) => estado.auth.suspension;

/**
 * Hay sesion usable cuando conocemos al usuario, no cuando hay un token: un
 * token vencido en el storage tambien es un token.
 */
export const selectEstaAutenticado = (estado: RootState) => estado.auth.usuario !== null;

/** Mientras sea false no se puede decidir si mandar a login o a la home. */
export const selectSesionVerificada = (estado: RootState) => estado.auth.arranque === 'listo';
