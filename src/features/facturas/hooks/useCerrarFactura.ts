import { useCallback, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import { useCerrarFacturaMutation } from '../api/facturasApi';

/**
 * Cerrar a mano una factura que ya no debe nada.
 *
 * Es para un solo caso: la factura quedo en $0 sin pagos a cuenta (todo se
 * pago en el mostrador). El pago que salda ya la cierra solo, pero sin pagos
 * nada la cierra, y seguiria recibiendo las proximas compras. Se confirma
 * antes: no se deshace.
 */
export function useCerrarFactura(facturaId: string | undefined, clienteId: string | undefined) {
  const [cerrar, estado] = useCerrarFacturaMutation();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pedir = useCallback(() => {
    setError(null);
    setConfirmando(true);
  }, []);

  const cancelar = useCallback(() => setConfirmando(false), []);

  const confirmar = useCallback(async () => {
    if (!facturaId || !clienteId) return;
    try {
      await cerrar({ id: facturaId, clienteId }).unwrap();
    } catch (fallo) {
      // "Todavia queda saldo...": viene redactado.
      setError(interpretarError(fallo)?.mensaje ?? 'No pudimos cerrar la factura.');
    }
    setConfirmando(false);
  }, [facturaId, clienteId, cerrar]);

  return { confirmando, pedir, cancelar, confirmar, cerrando: estado.isLoading, error };
}
