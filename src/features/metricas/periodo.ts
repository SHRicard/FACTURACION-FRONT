import { DateTime } from 'luxon';

import type { Periodo } from './types';

/**
 * Los periodos que se ofrecen. El backend acepta cualquier rango de hasta 36
 * meses, pero para mirar el negocio alcanza con cuatro atajos, y un selector
 * de fechas libre en un telefono es mas trabajo que respuesta.
 */
export type ClavePeriodo = 'mes' | 'tresMeses' | 'seisMeses' | 'anio';

export const PERIODOS: readonly { clave: ClavePeriodo; etiqueta: string }[] = [
  { clave: 'mes', etiqueta: 'Este mes' },
  { clave: 'tresMeses', etiqueta: 'Últimos 3 meses' },
  { clave: 'seisMeses', etiqueta: 'Últimos 6 meses' },
  { clave: 'anio', etiqueta: 'Este año' },
];

/** Si un parametro de ruta es una de las claves: el periodo viaja como texto. */
export const esClavePeriodo = (valor: unknown): valor is ClavePeriodo =>
  PERIODOS.some((periodo) => periodo.clave === valor);

/**
 * El de entrada: el mismo que usa el backend cuando no se le manda nada (el
 * mes en curso y los 5 anteriores).
 */
export const PERIODO_POR_DEFECTO: ClavePeriodo = 'seisMeses';

/**
 * Los dias se cortan en hora de Argentina, igual que en el backend: a las 22 hs
 * del 30 el telefono ya puede estar en el 1 si esta en UTC.
 */
const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

/** Cuantos meses para atras arranca cada periodo, contando el actual como 0. */
const MESES_ATRAS: Record<Exclude<ClavePeriodo, 'anio'>, number> = {
  mes: 0,
  tresMeses: 2,
  seisMeses: 5,
};

/**
 * Del atajo a las dos fechas que entiende la API (`aaaa-mm-dd`). Siempre
 * termina hoy: los dos dias entran enteros.
 */
export function rangoDePeriodo(clave: ClavePeriodo, ahora: DateTime = DateTime.now()): Periodo {
  const enZona = ahora.setZone(ZONA_HORARIA);
  // Si el motor de JS no conoce la zona, se sigue con la hora del telefono antes
  // que mandar fechas invalidas.
  const hoy = enZona.isValid ? enZona : ahora;

  const inicio =
    clave === 'anio'
      ? hoy.startOf('year')
      : hoy.startOf('month').minus({ months: MESES_ATRAS[clave] });

  return { desde: inicio.toISODate() ?? '', hasta: hoy.toISODate() ?? '' };
}
