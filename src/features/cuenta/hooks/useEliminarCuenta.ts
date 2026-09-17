import { useCallback, useState } from 'react';

import { useSesion } from '@/features/auth/hooks';
import { useMiMarcaQuery } from '@/features/marcas/api/marcasApi';
import { interpretarError } from '@/shared/utils';

import { useEliminarCuentaMutation } from '../api/cuentaApi';
import { PALABRA_CONFIRMACION } from '../schemas';

/**
 * Que se lleva puesto la baja. No es lo mismo en los dos casos, y hay que
 * decirselo ANTES de que confirme:
 *   'sola'        → es la unica duena: se borra la marca y todo el negocio
 *   'compartida'  → hay otros duenos: el negocio queda, se va solo su cuenta
 *   'desconocido' → todavia no sabemos (o no pudimos traer la marca)
 */
export type CasoDeBaja = 'sola' | 'compartida' | 'desconocido';

/**
 * Eliminar la cuenta, con la confirmacion escrita.
 *
 * Dos frenos, porque no se puede deshacer y no hay periodo de gracia: el
 * dialogo (que explica que se borra segun el caso) y la palabra `ELIMINAR`
 * escrita a mano. El backend exige la palabra igual; pedirla escrita es lo que
 * convierte un toque accidental en una decision.
 *
 * La marca se pide SOLO con el dialogo abierto: es un dato que no hace falta
 * mientras nadie este por darse de baja.
 */
export function useEliminarCuenta() {
  const { cerrarSesion } = useSesion();
  const [eliminar, { isLoading }] = useEliminarCuentaMutation();

  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);

  const marca = useMiMarcaQuery(undefined, { skip: !abierto });

  const abrir = useCallback(() => {
    setConfirmacion('');
    setError(null);
    setAbierto(true);
  }, []);

  const cerrar = useCallback(() => setAbierto(false), []);

  /** Se acepta en minusculas: el teclado del telefono no siempre respeta las mayusculas. */
  const puedeEliminar = confirmacion.trim().toUpperCase() === PALABRA_CONFIRMACION;

  const confirmar = useCallback(async () => {
    if (!puedeEliminar) return;
    setError(null);
    try {
      await eliminar().unwrap();
      // El token ya no vale: limpiar la sesion no es prolijidad, es lo unico
      // que evita una app llena de 401 hasta que alguien la cierre.
      cerrarSesion();
    } catch (fallo) {
      setError(interpretarError(fallo)?.mensaje ?? 'No pudimos eliminar la cuenta.');
    }
  }, [puedeEliminar, eliminar, cerrarSesion]);

  const duenos = marca.data?.duenos.length ?? 0;
  const caso: CasoDeBaja = !marca.data ? 'desconocido' : duenos <= 1 ? 'sola' : 'compartida';

  return {
    abierto,
    abrir,
    cerrar,
    confirmacion,
    escribir: setConfirmacion,
    puedeEliminar,
    confirmar,
    eliminando: isLoading,
    error,
    /** Que se borra en su caso, para decirselo antes de confirmar. */
    caso,
    /** Mientras se trae la marca no se sabe en que caso esta. */
    cargandoCaso: marca.isLoading,
  };
}
