import { formatearCantidad } from '@/shared/utils';

/**
 * `1` -> `Queda 1`, `40` -> `Quedan 40`, `0` -> `Quedan 0`.
 *
 * La cantidad de una especie es lo que le queda: los tickets se la van
 * descontando. Es un dato y nunca un limite, asi que el 0 se muestra igual que
 * cualquier otro numero, sin alarma.
 */
export function textoCantidad(cantidad: number): string {
  return cantidad === 1 ? 'Queda 1' : `Quedan ${formatearCantidad(cantidad)}`;
}
