import type { Href } from 'expo-router';

import type { Pendiente, Rol } from './types';

/**
 * Donde aterriza cada rol al entrar a la app.
 *
 * Es la UNICA fuente de verdad de "a donde va este usuario": la usan la raiz
 * (`/`), el login y el guard de rol. Sin esto, cada uno decide por su cuenta y
 * el dia que se agrega un rol hay que acordarse de tocar tres archivos.
 *
 * ⚠️ Este mapa y los roles que acepta cada area (`src/app/admin/_layout.tsx`,
 * `src/app/super-admin/_layout.tsx`) se cambian JUNTOS: si uno manda a un area
 * y el otro no lo deja entrar, el guard rebota para siempre.
 *
 * `desconocido`: un rol nuevo del backend que esta versión no conoce no se
 * adivina, se pide actualizar (K8). Así RutaProtegida, EntradaScreen y
 * PuertaBienvenida lo mandan solas a esa pantalla.
 */
export const INICIO_POR_ROL = {
  administrador: '/admin',
  super_admin: '/super-admin',
  desconocido: '/actualizar-app',
} as const satisfies Record<Rol, Href>;

/** A donde mandar a alguien sin sesion. */
export const RUTA_LOGIN = '/login' satisfies Href;

/**
 * A donde mandar a alguien cuya cuenta se suspendio. Va fuera de las areas y
 * sin guard: para cuando se abre, la sesion ya se cerro.
 */
export const RUTA_CUENTA_SUSPENDIDA = '/cuenta-suspendida' satisfies Href;

/**
 * La pantalla de bienvenida para lo que le falta a la cuenta. Mientras haya
 * algo pendiente, ni la raiz ni el area de administrador dejan pasar: sin
 * terminos aceptados, sin DNI o sin marca, el backend responde 403 a todo lo
 * del negocio.
 *
 * El orden es el mismo que el del backend: terminos → perfil → marca → adentro.
 *
 * `desconocido`: un paso nuevo del backend que esta versión no conoce tampoco
 * se adivina; se pide actualizar (K8).
 */
export const RUTA_POR_PENDIENTE = {
  terminos: '/bienvenida/terminos',
  perfil: '/bienvenida/perfil',
  marca: '/bienvenida/marca',
  desconocido: '/actualizar-app',
} as const satisfies Record<NonNullable<Pendiente>, Href>;
