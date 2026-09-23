import { useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';

/**
 * Guarda de salida del ticket a medio cargar (U5).
 *
 * Con renglones escritos y sin guardar, salir con la flecha, el gesto o el
 * botón atrás del sistema pregunta "¿Descartar?" en vez de tirar el ticket.
 * Cambiar de tab NO pregunta: deja el borrador donde estaba (ver el callback).
 *
 * No se exporta en el barril: lo usa solo useGuardarTicket.
 *
 * `permitirSalida` es para las salidas que sí son el final del formulario
 * (guardó, anuló): después de eso ya no hay borrador que cuidar.
 */
export function useSalidaConBorrador(hayBorrador: boolean) {
  const navigation = useNavigation();
  // Se lee solo dentro de callbacks, nunca durante el render (react-hooks/refs).
  const permitida = useRef(false);
  const [pendiente, setPendiente] = useState<NavigationAction | null>(null);

  usePreventRemove(hayBorrador, ({ data }) => {
    // Volver a despachar la acción pasa derecho: la acción ya marca esta ruta
    // como visitada (useOnPreventRemove), así que no se vuelve a frenar acá.
    if (permitida.current) {
      navigation.dispatch(data.action);
      return;
    }

    // El popToTop que dispara `popToTopOnBlur` llega DESPUÉS de la transición
    // del tab (BottomTabView.js:127), cuando esta pantalla ya no está
    // enfocada. No se pregunta porque la persona está mirando otro tab: la
    // acción queda cancelada, el stack no se vacía y el ticket aparece como
    // estaba al volver.
    if (!navigation.isFocused()) return;

    setPendiente(data.action);
  });

  const permitirSalida = useCallback(() => {
    permitida.current = true;
  }, []);

  /** "Descartar": sigue la salida que se había frenado. */
  const descartar = useCallback(() => {
    if (!pendiente) return;
    permitida.current = true;
    setPendiente(null);
    navigation.dispatch(pendiente);
  }, [navigation, pendiente]);

  /** "Seguir cargando": la salida queda cancelada. */
  const seguir = useCallback(() => setPendiente(null), []);

  return { preguntando: pendiente !== null, descartar, seguir, permitirSalida };
}
