import type { Middleware } from '@reduxjs/toolkit';

import { StorageKeys, storageService } from '@/services/storage';
import type { RootState } from '@/store';

import type { OnboardingPersistido } from './onboardingSlice';

/**
 * Guarda el progreso del tour despues de cada accion del slice.
 *
 * Va como middleware y no adentro de los hooks porque las acciones se despachan
 * desde dos lugares (la hoja y el menu de Mas): dejandolo en un hook, el dia que
 * aparezca un tercero se pierde el progreso sin que nadie se entere.
 *
 * Se guarda DESPUES de `next(accion)`: antes, el estado todavia es el viejo.
 */
export const persistirOnboardingMiddleware: Middleware = (store) => (next) => (accion) => {
  const resultado = next(accion);

  if (
    typeof accion === 'object' &&
    accion !== null &&
    'type' in accion &&
    typeof accion.type === 'string' &&
    accion.type.startsWith('onboarding/')
  ) {
    const { indice, terminado } = (store.getState() as RootState).onboarding;
    storageService.set<OnboardingPersistido>(StorageKeys.ONBOARDING, { indice, terminado });
  }

  return resultado;
};
