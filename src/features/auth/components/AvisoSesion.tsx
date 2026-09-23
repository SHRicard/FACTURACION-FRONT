import { Button, Modal } from '@/shared/ui/atoms';

import { useAvisoSesion } from '../hooks';

/**
 * El diálogo del aviso de una sola vez de la sesión (ej. "Tu cuenta quedó
 * vinculada a Google").
 *
 * Se monta UNA vez en la raíz, dentro de `ArranqueSesion`: así aparece sobre la
 * primera pantalla después del login, sin importar a dónde mande EntradaScreen
 * (la home, la bienvenida o los términos).
 */
export function AvisoSesion() {
  const { aviso, cerrar } = useAvisoSesion();

  return (
    <Modal
      visible={aviso !== null}
      onClose={cerrar}
      titulo={aviso?.titulo}
      descripcion={aviso?.texto}
      acciones={<Button label="Entendido" onPress={cerrar} />}
    />
  );
}
