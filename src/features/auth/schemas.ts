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

/**
 * La casilla de los terminos. Es `boolean` y no `z.literal(true)` a proposito:
 * el formulario arranca en `false` y necesita poder representar ese estado.
 *
 * El backend exige el campo en `/auth/registro` y en `/auth/google`, y responde
 * 400 si no viene o viene en false. Validarlo aca ahorra el viaje.
 */
export const aceptoTerminosSchema = z
  .boolean()
  .refine((acepto) => acepto, 'Tenes que aceptar los terminos y la politica de privacidad');

export const registroSchema = z
  .object({
    nombre: z.string().trim().min(2, 'Ingresa tu nombre'),
    email,
    password,
    confirmarPassword: z.string().min(1, 'Repeti la contrasena'),
    /**
     * Sin tildar no se crea la cuenta. Google lo mira: una casilla marcada de
     * fabrica, o un "al registrarte aceptas" sin casilla, es motivo de rechazo
     * en la revision de Play.
     */
    aceptoTerminosYCondiciones: aceptoTerminosSchema,
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

/**
 * Los roles que asigna el backend. `administrador` es el de toda cuenta nueva.
 *
 * 'desconocido' es lo que esta versión no sabe manejar: un rol nuevo del
 * backend no rompe el parseo de la sesión, cae acá y manda a /actualizar-app
 * (ver `rutas.ts`, K8).
 */
export const rolSchema = z
  .enum(['administrador', 'super_admin', 'desconocido'])
  .catch('desconocido');

/** Como se creo la cuenta. `local` = email + contrasena. */
export const proveedorSchema = z.enum(['local', 'google']);

/**
 * Que le falta a la cuenta para usar la app, en este orden:
 *   'terminos' → aceptar los terminos y la politica de privacidad
 *   'perfil'   → cargar el DNI
 *   'marca'    → crear su marca, o que un dueno lo sume con su DNI
 *   null       → nada: entra
 *   'desconocido' → un paso nuevo del backend que esta versión no sabe
 *                   manejar: manda a /actualizar-app (ver `rutas.ts`, K8)
 *
 * Viene en toda sesion (login, registro, Google, `/auth/me`) y en los 403 de
 * las rutas del negocio (`detalles.pendiente`). Con esto el front sabe a que
 * pantalla mandar sin interpretar mensajes. El super_admin siempre trae null.
 *
 * Los terminos van PRIMERO: mientras esten pendientes no hay onboarding ni
 * nada del negocio, el backend responde 403 a todo. Pasan a pendiente solos
 * cuando el texto legal cambia de version, asi que no es solo del alta.
 */
export const pendienteSchema = z
  .enum(['terminos', 'perfil', 'marca', 'desconocido'])
  .nullable()
  .catch('desconocido');

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
    // creada con email + contrasena no los trae. Un proveedor nuevo del
    // backend se lee como ausente en vez de romper la sesión (K8).
    proveedor: proveedorSchema.optional().catch(undefined),
    avatar: z.url().optional(),
    /** Sin puntos. Se carga UNA vez en "Completa tu perfil"; no lo cambia el usuario. */
    dni: z.string().optional(),
    /** Id de la marca en la que trabaja. Una sola: no se pasa de una a otra. */
    marca: z.string().nullish(),
    /**
     * Los terminos: si acepto, QUE version acepto y cuando. Se guarda la
     * version y no solo un si, asi el dia que cambia el texto todos vuelven a
     * aceptar sin perder el registro de lo que habia aceptado cada uno.
     *
     * Son opcionales porque una cuenta vieja puede no traerlos todavia; quien
     * decide si hay que aceptar es `pendiente`, no estos campos.
     */
    aceptoTerminosYCondiciones: z.boolean().optional(),
    terminosYCondicionesVersion: z.string().nullish(),
    terminosYCondicionesAceptadosEn: z.string().nullish(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .transform(({ _id, ...resto }) => ({ id: _id, ...resto }));

export const sesionSchema = z.object({
  token: z.string().min(1),
  usuario: usuarioSchema,
  // `default` por si un backend viejo no lo manda: sin el dato, se entra y el
  // primer 403 con `detalles.pendiente` manda a donde corresponde.
  pendiente: pendienteSchema.default(null),
});

/**
 * GET /auth/me: el usuario, sin token (el que tenemos sigue valiendo), y que le
 * falta. Tambien trae la marca con los duenos, pero se ignora a proposito: la
 * pantalla de la marca la pide a `/marcas/mia`, con sus estadisticas al dia.
 */
export const usuarioActualSchema = z.object({
  usuario: usuarioSchema,
  pendiente: pendienteSchema.default(null),
});

/** GET /auth/recuperar-password/:token — valida el link antes de mostrar el form. */
export const tokenResetValidoSchema = z.object({
  valido: z.literal(true),
  email: z.email(),
});

/**
 * El 403 de una cuenta suspendida por el super_admin. Llega en cualquier
 * request con sesion, y tambien en el login y en Google. `motivo` viene solo si
 * el super_admin escribio uno.
 */
export const CODIGO_CUENTA_SUSPENDIDA = 'CUENTA_SUSPENDIDA';

export const cuerpoSuspensionSchema = z.object({
  error: z.string().catch('Tu cuenta está suspendida.'),
  codigo: z.literal(CODIGO_CUENTA_SUSPENDIDA),
  detalles: z.object({ motivo: z.string().optional() }).optional(),
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
 *
 * Un caso nuevo del backend se lee como 'existente': es el que no dispara
 * ningún aviso (K8).
 */
export const casoGoogleSchema = z.enum(['creada', 'existente', 'vinculada']).catch('existente');

export const sesionGoogleSchema = sesionSchema.extend({
  caso: casoGoogleSchema,
});
