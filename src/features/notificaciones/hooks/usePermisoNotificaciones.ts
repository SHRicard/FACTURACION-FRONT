import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  abrirAjustesDelSistema,
  estadoPermisoNotificaciones,
  obtenerTokenPush,
  type EstadoPermiso,
} from '@/services/notificaciones';

import { useRegistrarDispositivoMutation } from '../api/notificacionesApi';

/**
 * La fila "Notificaciones" de Configuracion: si estan activadas y, si no,
 * como activarlas. Con el permiso bloqueado (ya no se puede preguntar) lo unico
 * que queda es abrir los ajustes del sistema.
 *
 * Se vuelve a mirar cuando la app vuelve al frente: la persona pudo haberlas
 * activado en los ajustes.
 */
export function usePermisoNotificaciones() {
  const [estado, setEstado] = useState<EstadoPermiso | null>(null);
  const [activando, setActivando] = useState(false);
  const [registrar] = useRegistrarDispositivoMutation();

  const leer = useCallback(() => {
    estadoPermisoNotificaciones()
      .then(setEstado)
      .catch(() => setEstado('noDisponible'));
  }, []);

  useEffect(() => {
    leer();
    const suscripcion = AppState.addEventListener('change', (actual) => {
      if (actual === 'active') leer();
    });
    return () => suscripcion.remove();
  }, [leer]);

  const activar = useCallback(async () => {
    if (estado === 'bloqueadas') {
      abrirAjustesDelSistema();
      return;
    }
    setActivando(true);
    try {
      const token = await obtenerTokenPush({ pedirPermiso: true });
      if (token) await registrar({ token });
    } catch {
      // Sin token la fila sigue diciendo "desactivadas": no hay nada mas que mostrar.
    } finally {
      setActivando(false);
      leer();
    }
  }, [estado, registrar, leer]);

  return { estado, activando, activar };
}
