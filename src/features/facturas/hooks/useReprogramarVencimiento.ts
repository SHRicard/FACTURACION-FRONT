import { useCallback, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useReprogramarVencimientoMutation } from '../api/facturasApi';

/**
 * "Te pago el 30": cambiarle la fecha a la factura activa.
 *
 * La factura deja de figurar vencida hasta la fecha nueva, pero el cumplimiento
 * NO cambia: se sigue midiendo contra el vencimiento original, asi reprogramar
 * no borra el atraso. La pantalla lo dice antes de guardar.
 */
export function useReprogramarVencimiento(
  facturaId: string | undefined,
  clienteId: string | undefined,
) {
  const [reprogramar, estado] = useReprogramarVencimientoMutation();

  const [abierto, setAbierto] = useState(false);
  /** El dia elegido, `aaaa-mm-dd`. Arranca vacio: se elige a proposito. */
  const [fecha, setFecha] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abrir = useCallback(() => {
    setFecha(null);
    setError(null);
    setAbierto(true);
  }, []);

  const cerrar = useCallback(() => setAbierto(false), []);

  const guardar = useCallback(async () => {
    if (!facturaId || !clienteId || !fecha) return;
    setError(null);
    try {
      await reprogramar({ id: facturaId, clienteId, venceEl: fecha }).unwrap();
      // La factura se re-pide sola: la mutacion invalido su tag.
      setAbierto(false);
    } catch (fallo) {
      // "No puede ser un dia que ya paso", "esta pagada": vienen redactados.
      setError(interpretarError(fallo)?.mensaje ?? 'No pudimos cambiar la fecha.');
    }
  }, [facturaId, clienteId, fecha, reprogramar]);

  return {
    abierto,
    abrir,
    cerrar,
    fecha,
    setFecha,
    guardar,
    guardando: estado.isLoading,
    error,
  };
}
