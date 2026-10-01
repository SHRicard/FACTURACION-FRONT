import { useMemo, useState } from 'react';

import { PERIODO_POR_DEFECTO, rangoDePeriodo, type ClavePeriodo } from '../periodo';

/**
 * El periodo elegido en el selector y las dos fechas que salen de el.
 *
 * Las fechas se calculan en el front: el backend recibe siempre `desde` y
 * `hasta`, y el atajo ("Ultimos 3 meses") es solo de la pantalla. `inicial`
 * sirve para abrir un detalle con el periodo que se estaba mirando.
 */
export function usePeriodo(inicial: ClavePeriodo = PERIODO_POR_DEFECTO) {
  const [clave, setClave] = useState<ClavePeriodo>(inicial);
  const rango = useMemo(() => rangoDePeriodo(clave), [clave]);

  return { clave, setClave, rango };
}
