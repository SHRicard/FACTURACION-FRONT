import type { z } from 'zod';

import type {
  loginSchema,
  recuperarPasswordSchema,
  registroSchema,
  respuestaSimpleSchema,
  sesionSchema,
  usuarioSchema,
} from './schemas';

// Tipos INFERIDOS de los schemas: una sola fuente de verdad.
export type LoginForm = z.infer<typeof loginSchema>;
export type RegistroForm = z.infer<typeof registroSchema>;
export type RecuperarPasswordForm = z.infer<typeof recuperarPasswordSchema>;

export type Usuario = z.infer<typeof usuarioSchema>;
export type Sesion = z.infer<typeof sesionSchema>;
export type RespuestaSimple = z.infer<typeof respuestaSimpleSchema>;
