import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useAnularTicketMutation } from '../api/ticketsApi';
import { volverDelFormulario } from '../navegar';

/**
 * Anular un ticket: baja logica con motivo opcional.
 *
 * El ticket queda tachado, no desaparece: es una libreta, lo que se escribio
 * mal se cruza con una raya. Y no hay deshacer — si se anulo por error, se
 * carga de nuevo.
 */
export function useAnularTicket(ticketId: string | undefined, clienteId: string) {
  const router = useRouter();
  const [anular, estado] = useAnularTicketMutation();

  const [confirmando, setConfirmando] = useState(false);
  const [motivo, setMotivo] = useState('');

  const pedirConfirmacion = useCallback(() => {
    setMotivo('');
    setConfirmando(true);
  }, []);

  const cancelar = useCallback(() => setConfirmando(false), []);

  const confirmar = useCallback(async () => {
    if (!ticketId) return;

    try {
      await anular({
        id: ticketId,
        clienteId,
        // El motivo en blanco no viaja: el body entero es opcional.
        ...(motivo.trim() ? { motivo: motivo.trim() } : {}),
      }).unwrap();

      setConfirmando(false);
      // A donde se vino, que ya tiene el saldo sin este ticket porque la
      // mutacion invalido sus tags.
      volverDelFormulario(router, clienteId);
    } catch {
      // Queda en `estado.error`: "El ticket ya esta anulado", "No se puede
      // modificar un ticket de una factura cerrada". Vienen redactados.
      setConfirmando(false);
    }
  }, [anular, ticketId, clienteId, motivo, router]);

  return {
    confirmando,
    motivo,
    setMotivo,
    pedirConfirmacion,
    cancelar,
    confirmar,
    anulando: estado.isLoading,
    error: interpretarError(estado.error)?.mensaje ?? null,
  };
}
