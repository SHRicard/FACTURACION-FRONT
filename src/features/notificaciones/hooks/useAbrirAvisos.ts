import { usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';

import { baseApi } from '@/services/api';
import { escucharNotificaciones } from '@/services/notificaciones';
import { useAppDispatch } from '@/store';

import { dataNotificacionSchema } from '../schemas';
import type { DataNotificacion } from '../types';

/** La pantalla de avisos. Abre con o sin sesion. */
export const RUTA_AVISOS = '/avisos';

/**
 * Que hacer al tocar una notificacion (docs/NOTIFICACIONES.md, 5.3): una
 * version nueva abre la tienda; cualquier otra, la pantalla de avisos. Va UNA
 * vez, en la raiz, DENTRO del navegador.
 *
 * El toque que abrio la app en frio queda pendiente hasta que la raiz (`/`)
 * termino de decidir a donde va la persona: si se navegara antes, el Redirect
 * de la raiz pisaria la pantalla de avisos.
 */
export function useAbrirAvisos() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const ruta = usePathname();
  const navegadorListo = Boolean(useRootNavigationState()?.key);
  // El toque a atender. Va en un ref y no en el estado: el efecto que lo
  // atiende lo consume sin volver a renderizar; `toques` solo lo despierta.
  const pendiente = useRef<DataNotificacion | null>(null);
  const [toques, setToques] = useState(0);

  useEffect(() => {
    if (!navegadorListo) return;
    return escucharNotificaciones({
      alTocar: ({ data }) => {
        const leido = dataNotificacionSchema.safeParse(data);
        if (!leido.success) return;
        pendiente.current = leido.data;
        setToques((n) => n + 1);
      },
      // Llego un aviso con la app abierta: la lista se vuelve a pedir.
      alLlegar: () => dispatch(baseApi.util.invalidateTags(['Aviso'])),
    });
  }, [navegadorListo, dispatch]);

  useEffect(() => {
    const data = pendiente.current;
    if (!data || !navegadorListo || ruta === '/') return;
    pendiente.current = null;

    if (data.tipo === 'version' && data.urlTienda) {
      void Linking.openURL(data.urlTienda);
      return;
    }
    // Ya parado en avisos no se apila otra: alcanza con traer la lista al dia.
    if (ruta === RUTA_AVISOS) {
      dispatch(baseApi.util.invalidateTags(['Aviso']));
      return;
    }
    router.push(RUTA_AVISOS);
  }, [toques, navegadorListo, ruta, router, dispatch]);
}
