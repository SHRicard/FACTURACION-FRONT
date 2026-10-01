import { DateTime } from 'luxon';

/**
 * Formateadores para mostrar datos. Viven aca y no en cada pantalla para que
 * un monto se vea igual en el listado, en el detalle y en el comprobante.
 */

const MONEDA = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  // Los montos de facturacion son enteros en la practica; los centavos solo
  // suman ruido en una fila de lista.
  maximumFractionDigits: 0,
});

/** `18000` -> `$ 18.000`. */
export function formatearMoneda(monto: number): string {
  return MONEDA.format(monto);
}

/**
 * `'2000000'` -> `'2.000.000'`. Para un monto MIENTRAS se escribe: trabaja con
 * el texto y no con un numero, asi un campo vacio sigue vacio (no `0`) y no
 * pierde digitos por redondeo.
 */
export function conPuntos(digitos: string): string {
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** `'2.000.000'` -> `'2000000'`. Lo que se escribe, sin puntos ni nada que no sea digito. */
export function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, '');
}

/**
 * `'Ana María Gallo'` -> `'AG'`: primera y ultima palabra, como un contacto
 * del telefono. Vacio si no hay nombre, para que quien lo use decida que
 * dibujar en su lugar.
 */
export function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return '';
  const primera = palabras[0]?.[0] ?? '';
  const ultima = palabras.length > 1 ? (palabras[palabras.length - 1]?.[0] ?? '') : '';
  return (primera + ultima).toUpperCase();
}

/** `'2026-09-11T02:59:59.999Z'` -> `'11 de septiembre de 2026'`. */
export function formatearFecha(iso?: string | null): string | null {
  if (!iso) return null;
  const fecha = DateTime.fromISO(iso).setLocale('es');
  return fecha.isValid ? fecha.toFormat("d 'de' LLLL 'de' yyyy") : null;
}

/** `'2026-09-11T02:59:59.999Z'` -> `'11/09/2026'`. Para tablas y chips. */
export function formatearFechaCorta(iso?: string | null): string | null {
  if (!iso) return null;
  const fecha = DateTime.fromISO(iso).setLocale('es');
  return fecha.isValid ? fecha.toFormat('dd/LL/yyyy') : null;
}

/**
 * Hoy, en `aaaa-mm-dd` y en hora de Argentina, que es como corta los dias el
 * backend. Es el minimo de cualquier fecha que se acuerde con un cliente: el
 * backend rechaza un vencimiento en un dia que ya paso.
 */
export function hoyEnArgentina(): string {
  const enZona = DateTime.now().setZone('America/Argentina/Buenos_Aires');
  // Si el motor de JS no conoce la zona, la hora del telefono antes que nada.
  return (enZona.isValid ? enZona : DateTime.now()).toISODate() ?? '';
}

/**
 * Como se lee una ventana de pago: `{ 1, 10 }` -> `'del 1 al 10'`.
 *
 * Un solo dia (`{ 5, 5 }`) se dice distinto: "del 5 al 5" suena a error.
 */
export function formatearVentanaPago(desdeDia: number, hastaDia: number): string {
  return desdeDia === hastaDia ? `el ${desdeDia}` : `del ${desdeDia} al ${hastaDia}`;
}

/**
 * `'2026-09-23T21:00:13Z'` -> `'hace 3 días'`. `null` si no hay fecha: quien
 * lo usa decide que decir ("nunca entró", "sin actividad"). Lo usan el panel
 * del super_admin y la pantalla de avisos.
 */
export function haceCuanto(iso?: string | null): string | null {
  if (!iso) return null;
  const fecha = DateTime.fromISO(iso);
  if (!fecha.isValid) return null;
  // Un reloj del telefono un poco adelantado no puede decir "dentro de 1 min".
  if (fecha > DateTime.now()) return 'recién';
  return fecha.toRelative({ locale: 'es' });
}
