import { z } from 'zod';

import { pendienteSchema, usuarioSchema } from '@/features/auth/schemas';

import { normalizarColor } from './paleta';

/** Mongo llama `_id` a la clave primaria. Se renombra en esta capa y nada mas. */
const aId = <T extends { _id: string }>({ _id, ...resto }: T) => ({ id: _id, ...resto });

/** Los textos de la marca y su largo maximo. Los mismos topes que el backend. */
export const LARGO_MAXIMO_MARCA = { nombre: 80, direccion: 120, telefono: 40 } as const;

/** Lo que acepta la firma del logo (`allowed_formats`). SVG no. */
export const FORMATOS_LOGO = ['png', 'jpg', 'jpeg', 'webp'] as const;

// ─────────────────── Respuestas de la API ───────────────────

/** Un dueno de la marca, como viene poblado desde los usuarios. */
export const duenoSchema = z
  .object({
    _id: z.string(),
    nombre: z.string(),
    email: z.string(),
    dni: z.string().optional(),
    avatar: z.string().optional(),
  })
  .transform(aId);

const ESTADISTICAS_VACIAS = {
  cantidadClientes: 0,
  totalVendido: 0,
  totalCobrado: 0,
  deudaPendiente: 0,
};

/**
 * Lo que mueve la marca. El backend lo recalcula desde cero con cada cambio:
 * aca solo se muestra, nunca se suma.
 */
export const estadisticasSchema = z.object({
  cantidadClientes: z.number().default(0),
  /** Todo lo que se llevaron: tickets sin anulados. */
  totalVendido: z.number().default(0),
  /** La plata que entro: lo que dejaron al comprar + los pagos a cuenta. */
  totalCobrado: z.number().default(0),
  /** Lo que le deben hoy. */
  deudaPendiente: z.number().default(0),
  actualizadasEl: z.string().optional(),
});

/** La marca: el negocio. Igual en el alta, en `/marcas/mia` y en cada cambio. */
export const marcaSchema = z
  .object({
    _id: z.string(),
    nombre: z.string(),
    direccion: z.string().optional(),
    telefono: z.string().optional(),
    logoUrl: z.string().optional(),
    /**
     * El server tiene Cloudinary configurado. Con false no se ofrece subir el
     * logo (la firma daria 503). No dice si la marca tiene logo: eso es `logoUrl`.
     */
    puedeSubirLogo: z.boolean().default(false),
    /**
     * Los colores del PDF, `#rrggbb`. Sin elegir, sale con los violetas de la
     * app; con uno solo, el otro toma el mismo.
     */
    colorPrimario: z.string().optional(),
    colorSecundario: z.string().optional(),
    creadaPor: z.string().optional(),
    estadisticas: estadisticasSchema.default(ESTADISTICAS_VACIAS),
    /** No se guardan en la marca: salen de los usuarios que apuntan a ella. */
    duenos: z.array(duenoSchema).default([]),
  })
  .transform(aId);

/** PUT /auth/me/perfil: el usuario con su DNI y lo que le sigue faltando. */
export const respuestaPerfilSchema = z.object({
  usuario: usuarioSchema,
  pendiente: pendienteSchema.default(null),
});

/**
 * Logo, paso 1: a donde subirlo y los campos firmados. Los `campos` van a
 * Cloudinary TAL CUAL: si se toca uno, la firma no coincide.
 */
export const firmaLogoSchema = z.object({
  urlSubida: z.url(),
  campos: z.record(z.string(), z.union([z.string(), z.number()])),
});

/** Irse de la marca: queda sin marca y vuelve a la bienvenida. */
export const respuestaIrmeSchema = z.object({
  mensaje: z.string(),
  pendiente: pendienteSchema,
});

// ─────────────────────────── Formularios ───────────────────────────

/**
 * El DNI se guarda en el formulario SOLO con digitos: los puntos que se ven
 * mientras se escribe los pone la pantalla. Argentino, 7 u 8 numeros, igual
 * que `normalizarDni` del backend.
 */
const dniForm = z
  .string()
  .min(1, 'Poné el DNI.')
  .regex(/^\d{7,8}$/, 'El DNI tiene que tener 7 u 8 números.');

export const perfilFormSchema = z.object({ dni: dniForm });

export const sumarDuenoFormSchema = z.object({ dni: dniForm });

/**
 * Los textos de la marca. Es lo que edita "Datos de la marca": los colores van
 * aparte, porque el backend solo los toca si vienen en el pedido.
 */
export const textosMarcaFormSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'Poné el nombre del negocio.')
    .max(LARGO_MAXIMO_MARCA.nombre, `Hasta ${LARGO_MAXIMO_MARCA.nombre} caracteres.`),
  direccion: z
    .string()
    .trim()
    .max(LARGO_MAXIMO_MARCA.direccion, `Hasta ${LARGO_MAXIMO_MARCA.direccion} caracteres.`),
  telefono: z
    .string()
    .trim()
    .max(LARGO_MAXIMO_MARCA.telefono, `Hasta ${LARGO_MAXIMO_MARCA.telefono} caracteres.`),
});

/** Un color como lo escribe la persona ("#1E3A8A", "abc"). Se normaliza al mandarlo. */
const colorForm = z
  .string()
  .refine((valor) => normalizarColor(valor) !== null, 'Tiene que ser un color hex, como #1e3a8a.');

export const coloresMarcaFormSchema = z.object({
  colorPrimario: colorForm,
  colorSecundario: colorForm,
});

/** El alta: los textos y los dos colores. */
export const marcaFormSchema = textosMarcaFormSchema.extend(coloresMarcaFormSchema.shape);
