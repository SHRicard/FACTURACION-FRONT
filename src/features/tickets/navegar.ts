import type { ImperativeRouter } from 'expo-router';

/**
 * Salida del formulario de ticket, despues de guardar o de anular.
 *
 * Vuelve a DONDE SE VINO en vez de saltar siempre a la ficha del cliente. Es lo
 * correcto en los dos caminos por los que se llega: desde la ficha se vuelve a
 * la ficha, y desde la cuenta del periodo se vuelve a la cuenta —que es donde
 * se ve el ticket recien cargado—. Los dos destinos ya estan al dia porque la
 * mutacion invalido sus tags.
 *
 * ⚠️ NO usar `replace` aca. Estando parado en `/clientes/:id/ticket`, un
 * `replace` a `/clientes/:id` deja el stack en [lista, ficha, ficha]: la flecha
 * de atras cae en la OTRA ficha, se ve como que no hizo nada, y el tab queda
 * recordando una ficha abierta en vez de la lista.
 *
 * El `replace` del fallback es para cuando no hay historial —se entro por link
 * directo—: ahi si hay que poner un destino, y la ficha es el que corresponde.
 */
export function volverDelFormulario(router: ImperativeRouter, clienteId: string): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(`/admin/clientes/${clienteId}`);
}
