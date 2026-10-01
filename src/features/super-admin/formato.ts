import { DateTime } from 'luxon';

import type { BadgeTone } from '@/shared/ui/atoms';
import { haceCuanto } from '@/shared/utils';

import type { PendienteAdmin, Plataforma, RolAdmin } from './types';

/**
 * Como se leen los datos del panel: "hace 3 días", el chip de una cuenta, el
 * uptime del server. Viven aca y no en cada pantalla para que una cuenta se
 * vea igual en el listado, en la ficha y en el tablero.
 */

/** Re-exportado: las pantallas del panel lo siguen pidiendo aca. */
export { haceCuanto };

/** Dias enteros desde una fecha. `null` si no hay fecha. */
export function diasDesde(iso?: string | null): number | null {
  if (!iso) return null;
  const fecha = DateTime.fromISO(iso);
  if (!fecha.isValid) return null;
  return Math.floor(DateTime.now().diff(fecha, 'days').days);
}

/** Una marca sin tickets ni pagos en este lapso figura como dormida. */
export const DIAS_ACTIVIDAD = 30;

/** `'2026-09-23T21:00:13Z'` -> `'23/09/2026 18:00'`, en la hora del telefono. */
export function formatearFechaHora(iso?: string | null): string | null {
  if (!iso) return null;
  const fecha = DateTime.fromISO(iso).setLocale('es');
  return fecha.isValid ? fecha.toFormat('dd/LL/yyyy HH:mm') : null;
}

export interface EstadoCuenta {
  etiqueta: string;
  tono: BadgeTone;
}

/**
 * El chip de una cuenta, en este orden de prioridad (docs/SUPER_ADMIN.md, 5.1):
 * suspendida, super admin, lo que le falta del onboarding, activa.
 *
 * El texto dice el estado: el color solo no alcanza para quien no lo percibe.
 */
export function estadoDeCuenta(cuenta: {
  suspendida: boolean;
  rol: RolAdmin;
  pendiente: PendienteAdmin;
}): EstadoCuenta {
  if (cuenta.suspendida) return { etiqueta: 'Suspendida', tono: 'error' };
  if (cuenta.rol === 'super_admin') return { etiqueta: 'Super admin', tono: 'primary' };
  switch (cuenta.pendiente) {
    case 'terminos':
      return { etiqueta: 'Sin aceptar términos', tono: 'warning' };
    case 'perfil':
      return { etiqueta: 'Sin DNI', tono: 'warning' };
    case 'marca':
      return { etiqueta: 'Sin marca', tono: 'warning' };
    case 'desconocido':
      return { etiqueta: 'Onboarding incompleto', tono: 'warning' };
    default:
      return { etiqueta: 'Activa', tono: 'success' };
  }
}

/** Como se nombra cada paso pendiente en una ficha. */
export const TEXTO_PENDIENTE: Record<NonNullable<PendienteAdmin>, string> = {
  terminos: 'Tiene que aceptar los términos vigentes',
  perfil: 'Tiene que cargar su DNI',
  marca: 'Tiene DNI pero todavía no tiene marca',
  desconocido: 'Le falta un paso que esta versión no conoce',
};

export const TEXTO_PLATAFORMA: Record<Plataforma, string> = {
  android: 'Android',
  ios: 'iOS',
  web: 'Web',
  desconocida: 'Otra',
};

/** `90061` -> `'1 d 1 h'`. Para el uptime del server: los segundos no dicen nada. */
export function textoDuracion(segundos: number): string {
  const dias = Math.floor(segundos / 86_400);
  const horas = Math.floor((segundos % 86_400) / 3_600);
  const minutos = Math.floor((segundos % 3_600) / 60);
  if (dias > 0) return `${dias} d ${horas} h`;
  if (horas > 0) return `${horas} h ${minutos} min`;
  return `${Math.max(minutos, 0)} min`;
}

const MEGAS = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

/** `143.6` -> `'143,6 MB'`. */
export function formatearMegas(megas: number | null | undefined): string {
  return megas === null || megas === undefined ? 'Sin dato' : `${MEGAS.format(megas)} MB`;
}

/**
 * Los codigos de Expo que significan "las notificaciones no estan llegando a
 * nadie" (docs/NOTIFICACIONES.md, 9): faltan o no coinciden las credenciales
 * de push. Los demas (un telefono desinstalado) los resuelve el back solo.
 */
const ERRORES_DE_CREDENCIALES: Record<string, string> = {
  InvalidCredentials: 'Expo no tiene la clave de Firebase (FCM V1) o de Apple.',
  MismatchSenderId:
    'google-services.json y la clave de FCM son de proyectos de Firebase distintos.',
};

/** El cartel rojo si algun envio choco con las credenciales, o null. */
export function problemaDeCredenciales(errores: Record<string, number>): string | null {
  const motivos = Object.entries(ERRORES_DE_CREDENCIALES)
    .filter(([codigo]) => (errores[codigo] ?? 0) > 0)
    .map(([, motivo]) => motivo);
  if (motivos.length === 0) return null;
  return `Las notificaciones no están llegando: revisá las credenciales push en EAS. ${motivos.join(' ')}`;
}
