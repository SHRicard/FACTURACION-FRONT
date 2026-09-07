import type { Href } from 'expo-router';

import type { Rol } from './types';

/**
 * Donde aterriza cada rol al entrar a la app.
 *
 * Es la UNICA fuente de verdad de "a donde va este usuario": la usan la raiz
 * (`/`), el login y el guard de rol. Sin esto, cada uno decide por su cuenta y
 * el dia que se agrega un rol hay que acordarse de tocar tres archivos.
 *
 * ⚠️ `super_admin` todavia apunta al area de administrador porque su propia
 * seccion no existe. Cuando se arme, este mapa y los roles que acepta
 * `/admin` (ver `src/app/admin/_layout.tsx`) se cambian JUNTOS: si uno manda a
 * `/admin` y el otro no lo deja entrar, el guard rebota para siempre.
 */
export const INICIO_POR_ROL = {
  administrador: '/admin',
  super_admin: '/admin',
} as const satisfies Record<Rol, Href>;

/** A donde mandar a alguien sin sesion. */
export const RUTA_LOGIN = '/login' satisfies Href;
