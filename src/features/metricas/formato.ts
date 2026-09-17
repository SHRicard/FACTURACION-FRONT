import { DateTime } from 'luxon';

import {
  contar,
  formatearCantidad,
  formatearFechaCorta,
  formatearMoneda,
  haceDias,
  textoDias,
} from '@/shared/utils';

import type { Agrupar, Periodo, PuntoDeudores, PuntoMorosos } from './types';

/**
 * Formateadores que solo usan las metricas. Los de plata, fechas, cantidades y
 * dias son los de toda la app (`@/shared/utils`); esos cuatro se re-exportan
 * para que las pantallas de metricas los sigan pidiendo a un solo lugar.
 */
export { contar, formatearCantidad, haceDias, textoDias };

const PORCENTAJE = new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1 });

/**
 * `53.1` -> `53,1 %`. `null` -> `—`: sin base no hay porcentaje, y un `0 %`
 * se leeria como "no se cobro nada".
 */
export function formatearPorcentaje(valor: number | null): string {
  return valor === null ? '—' : PORCENTAJE.format(valor / 100);
}

/** `'2026-07'` -> `'jul'`. Para el eje de un grafico por mes. */
export function mesCorto(mes: string): string {
  const fecha = DateTime.fromFormat(mes, 'yyyy-LL').setLocale('es');
  return fecha.isValid ? fecha.toFormat('LLL').replace('.', '') : mes;
}

/** `'2026-07'` -> `'julio 2026'`. */
export function mesLargo(mes: string): string {
  const fecha = DateTime.fromFormat(mes, 'yyyy-LL').setLocale('es');
  return fecha.isValid ? fecha.toFormat('LLLL yyyy') : mes;
}

/** Lo que devuelve la API, para decir que se esta mirando: `01/04/2026 al 15/09/2026`. */
export function textoPeriodo({ desde, hasta }: Periodo): string {
  return `${formatearFechaCorta(desde) ?? desde} al ${formatearFechaCorta(hasta) ?? hasta}`;
}

/** `'2026-10-01T15:00:00.000Z'` -> `'01/10'`. Para "vuelve ~01/10". */
export function diaYMes(iso: string | null): string | null {
  if (!iso) return null;
  const fecha = DateTime.fromISO(iso);
  return fecha.isValid ? fecha.toFormat('dd/LL') : null;
}

/** `'julio 2026'` -> `'Julio 2026'`: para arrancar una frase. */
const capitalizar = (texto: string): string => texto.charAt(0).toUpperCase() + texto.slice(1);

// ─────────────────── Morosos y deudores ───────────────────

/** Lo que va debajo de cada barra de la evolucion: `'abr'` por mes, `'31/08'` por semana. */
export function etiquetaDelTramo(etiqueta: string, agrupar: Agrupar): string {
  return agrupar === 'mes' ? mesCorto(etiqueta) : (diaYMes(etiqueta) ?? etiqueta);
}

/** Como se llama un tramo dentro de una frase: "Junio 2026", "Semana del 31/08". */
const cuandoDelTramo = (punto: { etiqueta: string; desde: string }, agrupar: Agrupar): string =>
  agrupar === 'mes'
    ? capitalizar(mesLargo(punto.etiqueta))
    : `Semana del ${diaYMes(punto.desde) ?? punto.desde}`;

/**
 * Un punto de la evolucion de morosos: "Junio 2026: 4 morosos · entraron 3 ·
 * salieron 0 · $ 424.500 vencidos".
 */
export function textoPuntoMorosos(punto: PuntoMorosos, agrupar: Agrupar): string {
  return `${cuandoDelTramo(punto, agrupar)}: ${contar(punto.morosos, 'moroso', 'morosos')} · entraron ${formatearCantidad(punto.nuevos)} · salieron ${formatearCantidad(punto.recuperados)} · ${formatearMoneda(punto.montoVencido)} vencidos`;
}

/**
 * Un punto de la evolucion de deudores: "Junio 2026: 12 deudores · $ 1.250.000
 * en la calle · $ 424.500 vencidos".
 */
export function textoPuntoDeudores(punto: PuntoDeudores, agrupar: Agrupar): string {
  return `${cuandoDelTramo(punto, agrupar)}: ${contar(punto.deudores, 'deudor', 'deudores')} · ${formatearMoneda(punto.deudaTotal)} en la calle · ${formatearMoneda(punto.deudaVencida)} vencidos`;
}

/** `4` -> `'+4 en el período'`, `-2` -> `'-2 en el período'`. */
export function textoVariacion(variacion: number): string {
  if (variacion === 0) return 'Sin cambios en el período';
  return `${variacion > 0 ? '+' : ''}${formatearCantidad(variacion)} en el período`;
}

/** `203` -> `'Último pago hace 203 días'`. `null`: nunca pago a cuenta. */
export function textoUltimoPago(diasSinPagar: number | null | undefined): string {
  return diasSinPagar == null ? 'Nunca pagó a cuenta' : `Último pago ${haceDias(diasSinPagar)}`;
}

/** `'Última compra 04/04'`. Si es reciente, sigue comprando con la cuenta vencida. */
export function textoUltimaCompra(compra: { fecha: string } | null | undefined): string {
  const dia = compra ? diaYMes(compra.fecha) : null;
  return dia ? `Última compra ${dia}` : 'Sin compras registradas';
}

// ─────────────────── Perfil del cliente ───────────────────

/**
 * Un mes de la serie de cumplimiento: "Junio 2026: 90 % de cumplimiento ·
 * 2 facturas". Un mes sin nada que juzgar lo dice con palabras.
 */
export function textoMesDeCumplimiento(mes: {
  mes: string;
  cumplimientoPromedio: number | null;
  evaluadas: number;
}): string {
  const cuando = capitalizar(mesLargo(mes.mes));
  if (mes.evaluadas === 0 || mes.cumplimientoPromedio === null) {
    return `${cuando}: no venció ninguna factura`;
  }
  return `${cuando}: ${formatearPorcentaje(mes.cumplimientoPromedio)} de cumplimiento · ${contar(mes.evaluadas, 'factura', 'facturas')}`;
}

// ─────────────────── Ventas por especie ───────────────────

/** Un mes del detalle de una especie: "Junio 2026: 13 unidades · $ 231.000". */
export function textoMesEspecie(mes: { mes: string; unidades: number; monto: number }): string {
  return `${capitalizar(mesLargo(mes.mes))}: ${contar(mes.unidades, 'unidad', 'unidades')} · ${formatearMoneda(mes.monto)}`;
}
