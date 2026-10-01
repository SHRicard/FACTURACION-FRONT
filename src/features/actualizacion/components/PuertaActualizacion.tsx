import { BackHandler, Modal as RNModal } from 'react-native';

import { Button, Modal } from '@/shared/ui/atoms';

import { useActualizacion } from '../hooks';
import { PantallaActualizacion } from './PantallaActualizacion';

/** Con la app bloqueada, atrás cierra la app: no hay nada que se pueda usar. */
const salirDeLaApp = () => {
  BackHandler.exitApp();
};

/**
 * Tapa la app cuando esta versión quedó por debajo de la mínima (K8), y avisa
 * sin bloquear cuando hay una más nueva.
 *
 * Va como HERMANO del `<Stack>` en el layout raíz, no envolviéndolo: así el
 * navegador nunca cambia de posición en el árbol y no se pierde el historial.
 * El bloqueo es un `Modal` nativo a pantalla completa, que además es modal para
 * TalkBack: lo de abajo no se puede recorrer.
 */
export function PuertaActualizacion() {
  const { desactualizada, avisoNueva, actualizar, descartarAviso } = useActualizacion();

  return (
    <>
      <RNModal
        visible={desactualizada}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={salirDeLaApp}
      >
        <PantallaActualizacion
          titulo="Actualizá la app"
          descripcion="Hay una versión nueva. Actualizala desde Google Play para seguir usando Facturación FCT."
          onActualizar={actualizar}
        />
      </RNModal>

      <Modal
        visible={avisoNueva}
        onClose={descartarAviso}
        titulo="Hay una versión nueva"
        descripcion="Actualizá la app desde Google Play para tener lo último."
        acciones={
          <>
            <Button label="Ahora no" variant="ghost" onPress={descartarAviso} />
            <Button label="Actualizar" onPress={actualizar} />
          </>
        }
      />
    </>
  );
}
