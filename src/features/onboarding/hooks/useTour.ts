import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/store';

import { PASOS } from '../pasos';
import {
  pasoAvanzado,
  selectIndicePaso,
  selectTourMinimizado,
  selectTourTerminado,
  selectTourVisible,
  tourMinimizado,
  tourReiniciado,
  tourRetomado,
  tourSalteado,
} from '../store/onboardingSlice';
import type { Paso } from '../types';

/**
 * Toda la logica del tour de bienvenida.
 *
 * La hoja solo dibuja lo que este hook le da: que paso mostrar y que hacer con
 * cada boton. Asi el guion se puede cambiar entero sin tocar el componente.
 */
export function useTour() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const indice = useAppSelector(selectIndicePaso);
  const visible = useAppSelector(selectTourVisible);
  const terminado = useAppSelector(selectTourTerminado);
  const minimizado = useAppSelector(selectTourMinimizado);

  const paso: Paso | null = visible ? (PASOS[indice] ?? null) : null;

  const avanzar = useCallback(() => {
    const actual = PASOS[indice];
    // Primero se navega y despues se avanza: al revés, la hoja ya muestra el
    // paso siguiente mientras la pantalla vieja todavia esta en pantalla.
    if (actual?.destino) router.push(actual.destino);
    dispatch(pasoAvanzado());
  }, [dispatch, indice, router]);

  const saltear = useCallback(() => {
    dispatch(tourSalteado());
  }, [dispatch]);

  const minimizar = useCallback(() => {
    dispatch(tourMinimizado());
  }, [dispatch]);

  /** Vuelve a mostrarla donde iba. Para el que la bajo sin terminarla. */
  const retomar = useCallback(() => {
    dispatch(tourRetomado());
  }, [dispatch]);

  /** Arranca de cero. Para el que ya la termino y la quiere ver de nuevo. */
  const reiniciar = useCallback(() => {
    dispatch(tourReiniciado());
  }, [dispatch]);

  return {
    /** El paso a mostrar, o null si no hay que mostrar nada. */
    paso,
    /** Para el contador "2 de 4". Se muestra en base 1. */
    numero: indice + 1,
    total: PASOS.length,
    /** Ya lo termino o lo salteo: sirve para ofrecer "verlo de nuevo". */
    terminado,
    /** La bajo con el dedo pero le queda guion: se le ofrece retomarla. */
    minimizado,
    avanzar,
    saltear,
    minimizar,
    retomar,
    reiniciar,
  };
}
