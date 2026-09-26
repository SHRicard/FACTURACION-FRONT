import type { Href, ImperativeRouter } from 'expo-router';

/**
 * Salida de una ficha despues de borrar lo que mostraba (una cuenta, un grupo
 * de errores): vuelve a la lista de la que se vino.
 *
 * El `replace` es para cuando no hay historial (se entro por link directo):
 * ahi hay que poner un destino, y la lista es el que corresponde. Con
 * historial, `back` y no `replace`: si no, el stack queda con la ficha borrada
 * debajo de la lista.
 */
export function volverAlListado(router: ImperativeRouter, lista: Href): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(lista);
}
