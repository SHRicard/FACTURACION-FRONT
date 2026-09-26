import { useEffect } from 'react';

import { selectSesionVerificada, selectToken } from '@/features/auth/store/authSlice';
import { obtenerTokenPush } from '@/services/notificaciones';
import { useAppSelector } from '@/store';

import { useRegistrarDispositivoMutation } from '../api/notificacionesApi';

/**
 * Registra el telefono al arrancar y cada vez que cambia la sesion: al entrar
 * queda asociado a la cuenta, al salir queda anonimo (y sigue recibiendo
 * avisos). Va UNA sola vez, en la raiz.
 *
 * El permiso se pide recien con la sesion iniciada: en Android 13+ e iOS, si
 * la persona dice que no dos veces ya no se puede volver a preguntar, y en la
 * primera pantalla todavia no confia en la app. Sin sesion solo se registra si
 * el permiso ya estaba (Android 12 o menos no tiene dialogo).
 */
export function useRegistrarDispositivo() {
  const verificada = useAppSelector(selectSesionVerificada);
  const token = useAppSelector(selectToken);
  const [registrar] = useRegistrarDispositivoMutation();

  useEffect(() => {
    // Hasta saber si la sesion vale, el Authorization podria ser uno vencido.
    if (!verificada) return;
    let cancelado = false;

    obtenerTokenPush({ pedirPermiso: token !== null })
      .then((tokenPush) => {
        if (tokenPush && !cancelado) void registrar({ token: tokenPush });
      })
      .catch(() => {
        // Sin notificaciones la app anda igual: nunca se corta el arranque por esto.
      });

    return () => {
      cancelado = true;
    };
  }, [verificada, token, registrar]);
}
