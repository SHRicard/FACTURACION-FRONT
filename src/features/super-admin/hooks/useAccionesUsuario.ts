import { useCallback, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import {
  useCerrarSesionesUsuarioMutation,
  useReactivarUsuarioMutation,
  useSuspenderUsuarioMutation,
} from '../api/superAdminApi';

/** Que dialogo de la ficha esta abierto. */
export type DialogoUsuario = 'suspender' | 'reactivar' | 'cerrarSesiones';

/** Lo que acepta el backend como motivo de una suspension. */
export const LARGO_MAXIMO_MOTIVO = 300;

/**
 * Las acciones de soporte sobre una cuenta: suspender (con motivo opcional),
 * reactivar y cerrar todas sus sesiones. Cada una pasa por un dialogo de
 * confirmacion: la ficha solo abre y cierra.
 *
 * Los 403 (es super_admin, o es uno mismo) se muestran dentro del dialogo, con
 * el texto del backend.
 */
export function useAccionesUsuario(id: string | undefined) {
  const [dialogo, setDialogo] = useState<DialogoUsuario | null>(null);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  /** Confirmacion de lo que se hizo, para el cartel de la ficha. */
  const [aviso, setAviso] = useState<string | null>(null);

  const [suspender, estadoSuspender] = useSuspenderUsuarioMutation();
  const [reactivar, estadoReactivar] = useReactivarUsuarioMutation();
  const [cerrarSesiones, estadoCerrar] = useCerrarSesionesUsuarioMutation();

  const ocupado = estadoSuspender.isLoading || estadoReactivar.isLoading || estadoCerrar.isLoading;

  const abrir = useCallback((cual: DialogoUsuario) => {
    setError(null);
    setMotivo('');
    setAviso(null);
    setDialogo(cual);
  }, []);

  const cerrar = useCallback(() => {
    if (!ocupado) setDialogo(null);
  }, [ocupado]);

  const confirmar = useCallback(async () => {
    if (!id || !dialogo) return;
    setError(null);
    try {
      if (dialogo === 'suspender') {
        const texto = motivo.trim();
        await suspender({ id, motivo: texto || undefined }).unwrap();
        setAviso('Cuenta suspendida: no puede entrar y su sesión abierta dejó de valer.');
      } else if (dialogo === 'reactivar') {
        await reactivar(id).unwrap();
        setAviso('Cuenta reactivada: ya puede volver a entrar.');
      } else {
        const respuesta = await cerrarSesiones(id).unwrap();
        setAviso(respuesta.mensaje);
      }
      setDialogo(null);
    } catch (fallo) {
      setError(interpretarError(fallo)?.mensaje ?? 'No pudimos completar la operación.');
    }
  }, [id, dialogo, motivo, suspender, reactivar, cerrarSesiones]);

  return {
    dialogo,
    abrir,
    cerrar,
    confirmar,
    motivo,
    setMotivo,
    ocupado,
    error,
    aviso,
    descartarAviso: useCallback(() => setAviso(null), []),
  };
}
