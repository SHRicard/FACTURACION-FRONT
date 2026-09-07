import type { z } from 'zod';

import type {
  cambiarPasswordSchema,
  casoGoogleSchema,
  loginSchema,
  recuperarPasswordSchema,
  proveedorSchema,
  registroSchema,
  resetearPasswordSchema,
  respuestaSimpleSchema,
  rolSchema,
  sesionGoogleSchema,
  sesionSchema,
  tokenResetValidoSchema,
  usuarioSchema,
} from './schemas';

// Tipos INFERIDOS de los schemas: una sola fuente de verdad.
export type LoginForm = z.infer<typeof loginSchema>;
export type RegistroForm = z.infer<typeof registroSchema>;
export type RecuperarPasswordForm = z.infer<typeof recuperarPasswordSchema>;
export type ResetearPasswordForm = z.infer<typeof resetearPasswordSchema>;
export type CambiarPasswordForm = z.infer<typeof cambiarPasswordSchema>;

export type Rol = z.infer<typeof rolSchema>;
export type Proveedor = z.infer<typeof proveedorSchema>;
export type CasoGoogle = z.infer<typeof casoGoogleSchema>;
export type Usuario = z.infer<typeof usuarioSchema>;
export type Sesion = z.infer<typeof sesionSchema>;
export type SesionGoogle = z.infer<typeof sesionGoogleSchema>;
export type TokenResetValido = z.infer<typeof tokenResetValidoSchema>;
export type RespuestaSimple = z.infer<typeof respuestaSimpleSchema>;
