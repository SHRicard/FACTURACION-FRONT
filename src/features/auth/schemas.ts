import { z } from 'zod';

/**
 * Schemas de la feature de autenticacion.
 *
 * Son la fuente de verdad: los tipos se INFIEREN de aca (no se escriben a mano)
 * y las respuestas de la API se validan con estos mismos schemas.
 */

const email = z.email({ message: 'Ingresa un email valido' });

/**
 * Minimo 6 caracteres, igual que el backend (LARGO_MINIMO_PASSWORD en
 * routes/auth.ts). Pedir mas que el backend no agrega seguridad y deja fuera a
 * cuentas que el servidor si acepta.
 */
const password = z.string().min(6, 'La contrasena necesita al menos 6 caracteres');

// ─────────────────────────── Formularios ───────────────────────────

export const loginSchema = z.object({
  email,
  // En login NO se valida el largo de la contrasena: la clave ya existe y
  // decirle al usuario "te faltan caracteres" al iniciar sesion es absurdo.
  password: z.string().min(1, 'Ingresa tu contrasena'),
});

export const registroSchema = z
  .object({
    nombre: z.string().trim().min(2, 'Ingresa tu nombre'),
    email,
    password,
    confirmarPassword: z.string().min(1, 'Repeti la contrasena'),
  })
  .refine((datos) => datos.password === datos.confirmarPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmarPassword'],
  });

export const recuperarPasswordSchema = z.object({ email });

export const resetearPasswordSchema = z
  .object({
    password,
    confirmarPassword: z.string().min(1, 'Repeti la contrasena'),
  })
  .refine((datos) => datos.password === datos.confirmarPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmarPassword'],
  });

export const cambiarPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, 'Ingresa tu contrasena actual'),
    passwordNueva: password,
    confirmarPassword: z.string().min(1, 'Repeti la contrasena'),
  })
  .refine((datos) => datos.passwordNueva === datos.confirmarPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmarPassword'],
  })
  .refine((datos) => datos.passwordActual !== datos.passwordNueva, {
    // El backend tambien lo rechaza; avisarlo antes ahorra el ida y vuelta.
    message: 'La contrasena nueva tiene que ser distinta de la actual',
    path: ['passwordNueva'],
  });

// ─────────────────── Respuestas de la API ───────────────────

/** Los roles que asigna el backend. `administrador` es el de toda cuenta nueva. */
export const rolSchema = z.enum(['administrador', 'super_admin']);

/** Como se creo la cuenta. `local` = email + contrasena. */
export const proveedorSchema = z.enum(['local', 'google']);

/**
 * Usuario tal como lo serializa el backend (`usuario.toJSON()`).
 *
 * Mongo llama `_id` a la clave primaria y el `toJSON` del modelo no la renombra,
 * asi que la mapeamos a `id` aca: es la unica capa que deberia saber que del
 * otro lado hay un Mongo. `createdAt`/`updatedAt` los agrega el `timestamps` de
 * mongoose, pero se declaran opcionales para no romper si un endpoint devuelve
 * el usuario proyectado sin ellos.
 */
export const usuarioSchema = z
  .object({
    _id: z.string(),
    nombre: z.string(),
    email: z.email(),
    rol: rolSchema,
    // Solo existen en cuentas de Google, por eso son opcionales: una cuenta
    // creada con email + contrasena no los trae.
    proveedor: proveedorSchema.optional(),
    avatar: z.url().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .transform(({ _id, ...resto }) => ({ id: _id, ...resto }));

export const sesionSchema = z.object({
  token: z.string().min(1),
  usuario: usuarioSchema,
});

/** GET /auth/me devuelve el usuario solo, sin token: el que tenemos sigue valiendo. */
export const usuarioActualSchema = z.object({ usuario: usuarioSchema });

/** GET /auth/recuperar-password/:token — valida el link antes de mostrar el form. */
export const tokenResetValidoSchema = z.object({
  valido: z.literal(true),
  email: z.email(),
});

/** Los endpoints que solo confirman una accion (ej. mail de recuperacion enviado). */
export const respuestaSimpleSchema = z.object({
  mensaje: z.string(),
});

/**
 * Respuesta de `POST /auth/google`. Es la sesion de siempre mas `caso`, que
 * dice que hizo el backend con la cuenta:
 *   creada    (201) - primera vez, cuenta nueva
 *   existente (200) - ya se habia logueado con Google
 *   vinculada (200) - tenia cuenta con contrasena y se le sumo Google
 */
export const casoGoogleSchema = z.enum(['creada', 'existente', 'vinculada']);

export const sesionGoogleSchema = sesionSchema.extend({
  caso: casoGoogleSchema,
});
