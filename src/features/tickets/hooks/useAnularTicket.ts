import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { formatearMoneda, interpretarError, volverDelFormulario } from '@/shared/utils';

import { useAnularTicketMutation } from '../api/ticketsApi';
import { irALaFactura } from '../navegar';
import { excedenteDePagos } from '../saldo';

interface OpcionesAnular {
  ticketId?: string;
  clienteId: string;
  /**
   * La factura activa del cliente, con lo fiado y lo pagado a cuenta. Con eso
   * se avisa ANTES de anular si la factura quedaria en negativo (K2).
   */
  factura: { id: string; totalFiado: number; totalPagos: number } | null;
  /** Lo que el ticket anota en la cuenta: es lo que deja de sumar al anularlo. */
  faltante: number;
  /** Se entro desde la factura: "Ver la factura" vuelve en vez de apilarla. */
  desdeFactura: boolean;
  /** Se llama justo antes de salir, para que la guarda del borrador no frene. */
  antesDeSalir?: () => void;
}

/** Lo que se le avisa en el dialogo de anular cuando la factura tiene pagos. */
export interface AvisoAnulacion {
  /** 'bloquea': no se puede anular sin antes anular el pago. */
  tipo: 'bloquea' | 'informa';
  texto: string;
}

/**
 * Anular un ticket: baja logica con motivo opcional.
 *
 * El ticket queda tachado, no desaparece: es una libreta, lo que se escribio
 * mal se cruza con una raya. Y no hay deshacer — si se anulo por error, se
 * carga de nuevo.
 *
 * No hay saldo a favor (K2): si al sacar este ticket lo pagado a cuenta supera
 * lo fiado, el back lo rechaza con 400 SALDO_NEGATIVO. Se avisa antes con los
 * numeros de la ficha y se ofrece ir a la factura a anular el pago.
 */
export function useAnularTicket({
  ticketId,
  clienteId,
  factura,
  faltante,
  desdeFactura,
  antesDeSalir,
}: OpcionesAnular) {
  const router = useRouter();
  const [anular, estado] = useAnularTicketMutation();

  const [confirmando, setConfirmando] = useState(false);
  const [motivo, setMotivo] = useState('');

  let aviso: AvisoAnulacion | null = null;
  if (factura && factura.totalPagos > 0) {
    aviso =
      excedenteDePagos(factura, { sale: faltante, entra: 0 }) > 0
        ? {
            tipo: 'bloquea',
            texto: `El cliente ya dejó ${formatearMoneda(factura.totalPagos)} a cuenta. Si anulás este ticket, lo pagado supera lo fiado. Primero anulá el pago desde la factura.`,
          }
        : {
            tipo: 'informa',
            texto: `Esta factura tiene pagos por ${formatearMoneda(factura.totalPagos)}; el saldo se recalcula.`,
          };
  }
  const bloqueado = aviso?.tipo === 'bloquea';

  const pedirConfirmacion = useCallback(() => {
    setMotivo('');
    setConfirmando(true);
  }, []);

  const cancelar = useCallback(() => setConfirmando(false), []);

  const confirmar = useCallback(async () => {
    if (!ticketId || bloqueado) return;

    try {
      await anular({
        id: ticketId,
        clienteId,
        // El motivo en blanco no viaja: el body entero es opcional.
        ...(motivo.trim() ? { motivo: motivo.trim() } : {}),
      }).unwrap();

      setConfirmando(false);
      // A donde se vino, que ya tiene el saldo sin este ticket porque la
      // mutacion invalido sus tags. Antes, se avisa que esta salida es la
      // buena: si no, la guarda del borrador preguntaria "¿Descartar?".
      antesDeSalir?.();
      volverDelFormulario(router, clienteId);
    } catch {
      // Queda en `estado.error`: "El ticket ya esta anulado", "No se puede
      // modificar un ticket de una factura cerrada", o el 400 SALDO_NEGATIVO
      // si alguien cobro recien y los numeros de la ficha estaban viejos.
      // Vienen redactados; con SALDO_NEGATIVO la pantalla suma "Ver la factura".
      setConfirmando(false);
    }
  }, [anular, ticketId, bloqueado, clienteId, motivo, antesDeSalir, router]);

  /** A la factura, para anular el pago que no deja anular el ticket. */
  const idFactura = factura?.id;
  const verLaFactura = useCallback(() => {
    setConfirmando(false);
    if (idFactura) irALaFactura(router, idFactura, desdeFactura);
  }, [idFactura, router, desdeFactura]);

  const error = interpretarError(estado.error);

  return {
    confirmando,
    motivo,
    setMotivo,
    pedirConfirmacion,
    cancelar,
    confirmar,
    anulando: estado.isLoading,
    error: error?.mensaje ?? null,
    /** Lo que se avisa en el dialogo si la factura tiene pagos a cuenta. */
    aviso,
    /** Anular dejaria la factura en negativo: va con "Ver la factura". */
    saldoNegativo: bloqueado || error?.codigo === 'SALDO_NEGATIVO',
    verLaFactura,
  };
}
