import { Button, Modal } from '@/shared/ui/atoms';

import type { useCerrarFactura } from '../hooks/useCerrarFactura';

interface CerrarFacturaProps {
  cierre: ReturnType<typeof useCerrarFactura>;
}

/**
 * La confirmacion de cerrar a mano una factura que ya no debe nada. Se pide
 * porque no se deshace: queda saldada, con su numero, y la proxima compra abre
 * una factura nueva.
 */
export function CerrarFactura({ cierre }: CerrarFacturaProps) {
  return (
    <Modal
      visible={cierre.confirmando}
      onClose={cierre.cancelar}
      titulo="¿Cerrar esta factura?"
      descripcion="No debe nada: se pagó todo en el mostrador. Queda saldada, con su número, y la próxima compra abre una factura nueva. No se puede deshacer."
      acciones={
        <>
          <Button label="Cancelar" variant="ghost" onPress={cierre.cancelar} />
          <Button label="Cerrar factura" loading={cierre.cerrando} onPress={cierre.confirmar} />
        </>
      }
    />
  );
}
