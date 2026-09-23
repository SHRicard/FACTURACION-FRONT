import type { z } from 'zod';

import type {
  cambiarPasswordSchema,
  casoGoogleSchema,
  loginSchema,
  pendienteSchema,
  recuperarPasswordSchema,
  proveedorSchema,
  registroSchema,
  resetearPasswordSchema,
  respuestaSimpleSchema,
  rolSchema,
  sesionGoogleSchema,
  sesionSchema,
  tokenResetValidoSchema,
  usuarioActualSchema,
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
export type Pendiente = z.infer<typeof pendienteSchema>;
export type UsuarioActual = z.infer<typeof usuarioActualSchema>;
export type Sesion = z.infer<typeof sesionSchema>;
export type SesionGoogle = z.infer<typeof sesionGoogleSchema>;
export type TokenResetValido = z.infer<typeof tokenResetValidoSchema>;

/**
 * Lo que manda el front a `/auth/google`. No sale de un schema porque no es una
 * respuesta ni un formulario: es el argumento de la mutation.
 *
 * `aceptoTerminosYCondiciones` sin definir = no se manda el campo. Es distinto
 * de mandarlo en `false`: el backend solo lo exige cuando tiene que crear la
 * cuenta, y omitirlo deja entrar a quien ya la tiene sin preguntarle de nuevo.
 */
export type DatosGoogle = {
  idToken: string;
  aceptoTerminosYCondiciones?: boolean;
};
export type RespuestaSimple = z.infer<typeof respuestaSimpleSchema>;

/**
 * Aviso de una sola vez que la primera pantalla después de entrar muestra en
 * un diálogo. Es una clave y no el texto: el texto vive en `useAvisoSesion`.
 *
 *   'google-vinculada' → entró con Google sobre una cuenta con contraseña; el
 *                        back invalidó la contraseña anterior (K13).
 */
export type AvisoSesion = 'google-vinculada';
