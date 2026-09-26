import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import {
  useBorrarAvisoMutation,
  useDetalleAvisoAdminQuery,
  useReintentarAvisoMutation,
} from '../api/avisosApi';
import { volverAlListado } from '../navegar';

/** Mientras se manda, el avance se vuelve a pedir cada 2 segundos. */
const INTERVALO_ENVIANDO_MS = 2000;

/**
 * El detalle de un aviso con el avance del envio en vivo, mas reintentar (si
 * fallo) y borrar. Las confirmaciones de entrega llegan 15-20 minutos despues:
 * para eso esta el refrescar.
 */
export function useAvisoAdmin(id: string | undefined) {
  const router = useRouter();
  const consulta = useDetalleAvisoAdminQuery(id ?? '', { skip: !id });
  const { refetch } = consulta;

  // Una segunda suscripcion a la MISMA entrada de cache, que consulta cada 2 s
  // solo mientras se manda: en cuanto deja de estar "enviando", se corta.
  const enviando = consulta.data?.aviso.estado === 'enviando';
  useDetalleAvisoAdminQuery(id ?? '', {
    skip: !id || !enviando,
    pollingInterval: INTERVALO_ENVIANDO_MS,
    skipPollingIfUnfocused: true,
  });

  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const detalleError = interpretarError(consulta.error);
  const [error, setError] = useState<string | null>(null);

  // ─── Reintentar ───
  const [reintentar, estadoReintentar] = useReintentarAvisoMutation();
  const reintentarEnvio = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      // Invalida el tag: vuelve como "enviando" y el polling arranca solo.
      await reintentar(id).unwrap();
    } catch (fallo) {
      // 409: ya no estaba fallido. Se trae el estado real.
      setError(interpretarError(fallo)?.mensaje ?? 'No pudimos reintentar.');
      void refetch();
    }
  }, [id, reintentar, refetch]);

  // ─── Borrar ───
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [errorBorrar, setErrorBorrar] = useState<string | null>(null);
  const [borrar, estadoBorrar] = useBorrarAvisoMutation();
  const confirmarBorrar = useCallback(async () => {
    if (!id) return;
    setErrorBorrar(null);
    try {
      await borrar(id).unwrap();
      setConfirmandoBorrar(false);
      volverAlListado(router, '/super-admin/mas/avisos');
    } catch (fallo) {
      // 409: se esta mandando todavia.
      setErrorBorrar(interpretarError(fallo)?.mensaje ?? 'No pudimos borrarlo.');
    }
  }, [id, borrar, router]);

  return {
    aviso: consulta.data?.aviso ?? null,
    sinConfirmar: consulta.data?.sinConfirmar ?? 0,
    cargando: consulta.isLoading,
    error: detalleError?.mensaje ?? null,
    noExiste: detalleError?.status === 404,
    refrescar,
    reintentar: refrescar,
    errorAccion: error,
    reintentarEnvio,
    reintentando: estadoReintentar.isLoading,
    borrar: {
      confirmando: confirmandoBorrar,
      pedir: useCallback(() => {
        setErrorBorrar(null);
        setConfirmandoBorrar(true);
      }, []),
      cancelar: useCallback(() => {
        if (!estadoBorrar.isLoading) setConfirmandoBorrar(false);
      }, [estadoBorrar.isLoading]),
      confirmar: confirmarBorrar,
      borrando: estadoBorrar.isLoading,
      error: errorBorrar,
    },
  };
}
