import { createSlice } from '@reduxjs/toolkit';

import { StorageKeys, storageService } from '@/services/storage';
import type { RootState } from '@/store';

import { PASOS } from '../pasos';

/** Lo unico que sobrevive a cerrar la app. */
export type OnboardingPersistido = {
  indice: number;
  terminado: boolean;
};

type OnboardingState = OnboardingPersistido & {
  /**
   * La bajo con el dedo. NO se persiste a proposito: bajar la hoja es "ahora
   * no", no "nunca mas". Para nunca mas esta "Saltear", que marca `terminado`.
   */
  minimizado: boolean;
};

/**
 * Se lee de forma SINCRONICA (MMKV lo permite) para que el primer render ya
 * sepa si la hoja va o no. Leyendolo en un efecto, quien ya termino el tour
 * veria la hoja aparecer y desaparecer de un salto.
 */
function leerGuardado(): OnboardingPersistido {
  const guardado = storageService.get<OnboardingPersistido>(StorageKeys.ONBOARDING);
  // El storage puede traer basura o un guion mas corto que el de la version
  // anterior: se acota contra el largo actual en vez de confiar en el numero.
  if (!guardado || typeof guardado.indice !== 'number') return { indice: 0, terminado: false };

  return {
    indice: Math.min(Math.max(guardado.indice, 0), PASOS.length - 1),
    terminado: guardado.terminado === true,
  };
}

const estadoInicial: OnboardingState = { ...leerGuardado(), minimizado: false };

/**
 * Estado del tour de bienvenida.
 *
 * Los reducers son puros: guardar en el storage es un efecto y lo hace
 * `persistirOnboardingMiddleware`. Asi no importa desde donde se despache la
 * accion (la hoja, el menu de Mas), siempre se persiste.
 */
const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState: estadoInicial,
  reducers: {
    pasoAvanzado: (estado) => {
      if (estado.indice >= PASOS.length - 1) {
        estado.terminado = true;
        return;
      }
      estado.indice += 1;
    },

    /** "No me lo muestres mas". */
    tourSalteado: (estado) => {
      estado.terminado = true;
    },

    /** Se bajo la hoja con el dedo. Vuelve sola la proxima vez que abra la app. */
    tourMinimizado: (estado) => {
      estado.minimizado = true;
    },

    /** Lo bajo antes de tiempo y lo quiere de vuelta. Sigue donde iba. */
    tourRetomado: (estado) => {
      estado.minimizado = false;
    },

    /** Lo pidio de nuevo desde Mas, ya terminado. Arranca de cero. */
    tourReiniciado: (estado) => {
      estado.indice = 0;
      estado.terminado = false;
      estado.minimizado = false;
    },
  },
});

export const { pasoAvanzado, tourSalteado, tourMinimizado, tourRetomado, tourReiniciado } =
  onboardingSlice.actions;
export const onboardingReducer = onboardingSlice.reducer;

export const selectIndicePaso = (estado: RootState) => estado.onboarding.indice;

/** La hoja se muestra mientras quede guion y no la hayan bajado. */
export const selectTourVisible = (estado: RootState) =>
  !estado.onboarding.terminado && !estado.onboarding.minimizado;

export const selectTourTerminado = (estado: RootState) => estado.onboarding.terminado;

/** La bajo con el dedo pero todavia le queda guion por ver. */
export const selectTourMinimizado = (estado: RootState) =>
  estado.onboarding.minimizado && !estado.onboarding.terminado;
