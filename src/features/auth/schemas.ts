import { z } from 'zod';

/**
 * Schemas de la feature de autenticacion.
 *
 * Son la fuente de verdad: los tipos se INFIEREN de aca (no se escriben a mano)
 * y las respuestas de la API se validan con estos mismos schemas.
 */

const email = z.email({ message: 'Ingresa un email valido' });

const password = z
  .string()
  .min(8, 'La contrasena necesita al menos 8 caracteres')
  .regex(/[a-z]/, 'Necesita al menos una minuscula')
  .regex(/[A-Z]/, 'Necesita al menos una mayuscula')
  .regex(/[0-9]/, 'Necesita al menos un numero');

// ─────────────────────────── Formularios ───────────────────────────

export const loginSchema = z.object({
  email,
  // En login NO se valida la fuerza de la contrasena: la clave ya existe y
  // decirle al usuario "te falta una mayuscula" al iniciar sesion es absurdo.
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

// ─────────────────── Respuestas de la API ───────────────────

export const usuarioSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  email: z.email(),
});

export const sesionSchema = z.object({
  token: z.string().min(1),
  usuario: usuarioSchema,
});

/** Los endpoints que solo confirman una accion (ej. mail de recuperacion enviado). */
export const respuestaSimpleSchema = z.object({
  mensaje: z.string(),
});
