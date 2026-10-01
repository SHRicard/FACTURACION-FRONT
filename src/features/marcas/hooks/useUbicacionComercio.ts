import { useCallback, useState } from 'react';

import {
  abrirAjustesDeLaApp,
  obtenerDireccionActual,
  type ResultadoUbicacion,
} from '@/services/ubicacion';

export interface AvisoUbicacion {
  texto: string;
  tono: 'success' | 'warning' | 'error';
  /** Muestra "Abrir ajustes": el permiso quedo negado y solo se cambia ahi. */
  ofreceAjustes: boolean;
}

/** Que decirle a la persona en cada caso. Ninguno la deja trabada: siempre puede escribirla. */
function avisoPara(resultado: Exclude<ResultadoUbicacion, { tipo: 'ok' }>): AvisoUbicacion {
  switch (resultado.tipo) {
    case 'sinPermiso':
      return resultado.puedePreguntar
        ? {
            texto: 'Sin permiso de ubicación no la podemos completar. Escribila a mano.',
            tono: 'warning',
            ofreceAjustes: false,
          }
        : {
            texto:
              'La ubicación está bloqueada para la app. Activala en Ajustes o escribila a mano.',
            tono: 'warning',
            ofreceAjustes: true,
          };
    case 'gpsApagado':
      return {
        texto: 'La ubicación del teléfono está apagada. Prendela y probá de nuevo.',
        tono: 'warning',
        ofreceAjustes: false,
      };
    case 'sinSenal':
      return {
        texto: 'No encontramos tu ubicación. Probá cerca de una ventana o escribila a mano.',
        tono: 'warning',
        ofreceAjustes: false,
      };
    case 'sinDireccion':
      return {
        texto: 'Encontramos dónde estás, pero no la calle. Escribila a mano.',
        tono: 'warning',
        ofreceAjustes: false,
      };
    case 'noDisponible':
      return {
        texto:
          'Esta versión de la app todavía no usa la ubicación. Actualizala o escribila a mano.',
        tono: 'error',
        ofreceAjustes: false,
      };
  }
}

/**
 * "Usar mi ubicacion" para la direccion del comercio.
 *
 * Tiene sentido porque la marca se crea casi siempre parado en el local: un
 * toque y la direccion queda escrita, sin tipear "Av. Siempreviva 742" en el
 * teclado del telefono. El resultado se puede corregir: es un punto de
 * partida, no un dato cerrado.
 */
export function useUbicacionComercio(ponerDireccion: (direccion: string) => void) {
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<AvisoUbicacion | null>(null);

  const usar = useCallback(async () => {
    setAviso(null);
    setBuscando(true);
    try {
      const resultado = await obtenerDireccionActual();
      if (resultado.tipo === 'ok') {
        ponerDireccion(resultado.direccion);
        setAviso({
          texto: 'Revisala: el GPS puede errarle por unos metros.',
          tono: 'success',
          ofreceAjustes: false,
        });
      } else {
        setAviso(avisoPara(resultado));
      }
    } catch {
      setAviso({
        texto: 'No pudimos usar la ubicación. Escribila a mano.',
        tono: 'error',
        ofreceAjustes: false,
      });
    } finally {
      setBuscando(false);
    }
  }, [ponerDireccion]);

  const abrirAjustes = useCallback(() => {
    void abrirAjustesDeLaApp();
  }, []);

  return { usar, buscando, aviso, abrirAjustes };
}
