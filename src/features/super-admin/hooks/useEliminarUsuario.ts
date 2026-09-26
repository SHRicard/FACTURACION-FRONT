import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useEliminarUsuarioAdminMutation } from '../api/superAdminApi';
import { volverAlListado } from '../navegar';
import { detallesUnicoDuenoSchema, PALABRA_ELIMINAR } from '../schemas';
import type { DetallesUnicoDueno } from '../types';

/** El 409 que frena la baja del unico dueno de una marca. */
const CODIGO_UNICO_DUENO = 'UNICO_DUENO';

/**
 * La baja de una cuenta con el doble paso del contrato (docs/SUPER_ADMIN.md, 5.7):
 *
 *   [Eliminar] → escribir ELIMINAR → DELETE { confirmar }
 *        200 → vuelve a la lista
 *        409 UNICO_DUENO → segundo dialogo con lo que se pierde
 *                          → DELETE { confirmar, eliminarMarca: true } → 200
 */
export function useEliminarUsuario(id: string | undefined) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState('');
  /** Con valor = segundo freno: la marca que se borraria con la cuenta. */
  const [marca, setMarca] = useState<DetallesUnicoDueno['marca'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eliminar, { isLoading }] = useEliminarUsuarioAdminMutation();

  const abrir = useCallback(() => {
    setConfirmacion('');
    setMarca(null);
    setError(null);
    setAbierto(true);
  }, []);

  const cerrar = useCallback(() => {
    if (!isLoading) setAbierto(false);
  }, [isLoading]);

  const confirmar = useCallback(async () => {
    if (!id) return;
    // El boton ya viene apagado, pero Enter en el teclado no pasa por el boton.
    if (!marca && confirmacion.trim().toUpperCase() !== PALABRA_ELIMINAR) return;
    setError(null);
    try {
      await eliminar({ id, eliminarMarca: marca !== null }).unwrap();
      setAbierto(false);
      volverAlListado(router, '/super-admin/usuarios');
    } catch (fallo) {
      const detalle = interpretarError(fallo);
      if (detalle?.codigo === CODIGO_UNICO_DUENO) {
        const leido = detallesUnicoDuenoSchema.safeParse(detalle.datos);
        if (leido.success) {
          setMarca(leido.data.marca);
          return;
        }
      }
      setError(detalle?.mensaje ?? 'No pudimos eliminar la cuenta.');
    }
  }, [id, marca, confirmacion, eliminar, router]);

  return {
    abierto,
    abrir,
    cerrar,
    confirmar,
    confirmacion,
    setConfirmacion,
    marca,
    eliminando: isLoading,
    error,
  };
}
