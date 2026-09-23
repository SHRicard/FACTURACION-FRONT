import { useCallback } from 'react';
import { Linking } from 'react-native';

import { VERSION_APP } from '@/config';
import { useAppDispatch, useAppSelector } from '@/store';

import { useVersionAppQuery } from '../api/actualizacionApi';
import { avisoActualizacionDescartado, selectActualizacion } from '../store/actualizacionSlice';

/**
 * Si esta versión de la app se puede seguir usando, y cómo ir a actualizarla.
 *
 * Pide `/app/version` al montarse, sin usar el resultado: lo absorbe el slice
 * por su matcher, junto con los 426 que atrapa el middleware. Sin versión
 * propia no hay con qué comparar, así que ni se pide.
 *
 *   desactualizada → por debajo de la mínima: la app queda tapada.
 *   avisoNueva     → hay una más nueva pero esta sirve: aviso que se descarta.
 */
export function useActualizacion() {
  const dispatch = useAppDispatch();
  useVersionAppQuery(undefined, { skip: VERSION_APP === null });
  const { desactualizada, hayNueva, avisoDescartado, urlTienda } =
    useAppSelector(selectActualizacion);

  const actualizar = useCallback(() => {
    // Sin tienda instalada (un emulador sin Play) no hay nada mejor que hacer.
    Linking.openURL(urlTienda).catch(() => undefined);
  }, [urlTienda]);

  const descartarAviso = useCallback(() => {
    dispatch(avisoActualizacionDescartado());
  }, [dispatch]);

  return {
    desactualizada,
    // Con la app bloqueada, el aviso no suma nada.
    avisoNueva: hayNueva && !avisoDescartado && !desactualizada,
    actualizar,
    descartarAviso,
  };
}
