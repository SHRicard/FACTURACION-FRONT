import { useCallback, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useAnularPagoMutation } from '../api/pagosApi';
import type { Pago } from '../types';

/**
 * Anular un pago: baja logica de la entrega entera, con motivo opcional.
 *
 * El pago queda tachado, no desaparece. Y a diferencia del ticket, se puede
 * anular aunque la factura este pagada (vuelve a abierta y a deber): un monto
 * mal tipeado tiene que poder corregirse. No hay deshacer: si se anulo por
 * error, se registra de nuevo.
 */
export function useAnularPago(clienteId?: string) {
  const [anular, estado] = useAnularPagoMutation();

  /** El pago que se esta por anular, o null si no hay confirmacion abierta. */
  const [pago, setPago] = useState<Pago | null>(null);
  const [motivo, setMotivo] = useState('');

  const pedirConfirmacion = useCallback((elegido: Pago) => {
    setMotivo('');
    setPago(elegido);
  }, []);

  const cancelar = useCallback(() => setPago(null), []);

  const confirmar = useCallback(async () => {
    if (!pago) return;

    try {
      await anular({
        id: pago.id,
        clienteId,
        // El motivo en blanco no viaja: el body entero es opcional.
        ...(motivo.trim() ? { motivo: motivo.trim() } : {}),
      }).unwrap();
    } catch {
      // Queda en `estado.error`: "El pago ya esta anulado", etc. Viene redactado.
    }
    // La factura se re-pide sola porque la mutacion la invalido.
    setPago(null);
  }, [anular, pago, clienteId, motivo]);

  return {
    pago,
    motivo,
    setMotivo,
    pedirConfirmacion,
    cancelar,
    confirmar,
    anulando: estado.isLoading,
    error: interpretarError(estado.error)?.mensaje ?? null,
  };
}
