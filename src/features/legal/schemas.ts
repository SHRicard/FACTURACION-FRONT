import { z } from 'zod';

/**
 * Schemas de los documentos legales (terminos, privacidad y como darse de baja).
 *
 * Los tres los publica el backend en `/legal/*`. Devuelven HTML si los abre un
 * navegador y JSON si se los pide con `?formato=json`: la app usa el JSON y los
 * dibuja con sus propios estilos, en vez de meter un WebView que no respeta el
 * tema ni la tipografia elegida.
 */

/**
 * Los documentos de TEXTO: los que vienen en secciones y se leen de arriba a
 * abajo. El valor es tambien el segmento de la URL (`/legal/terminos`).
 *
 * `eliminar-cuenta` no esta aca a proposito: el backend lo publica con otra
 * forma (ver `bajaCuentaSchema`), no con secciones.
 */
export const tipoDocumentoSchema = z.enum(['terminos', 'privacidad']);

export const seccionLegalSchema = z.object({
  titulo: z.string(),
  contenido: z.string(),
});

/**
 * Un documento legal ya listo para dibujar.
 *
 * `version` es la fecha del texto ("2026-09-17") y es la que el backend guarda
 * en el usuario al aceptar: cuando sube, todas las cuentas vuelven a
 * `pendiente: 'terminos'` solas y el front no toca nada.
 */
export const documentoLegalSchema = z.object({
  tipo: z.string(),
  version: z.string(),
  titulo: z.string(),
  actualizadoEl: z.string().optional(),
  /** El correo de contacto que exige Google. Sale de `LEGAL_CONTACT_EMAIL`. */
  contacto: z.string().optional(),
  secciones: z.array(seccionLegalSchema).default([]),
});

/**
 * `GET /legal/eliminar-cuenta`: los pasos de la baja. NO es un documento de
 * secciones como los otros dos, por eso tiene su propio schema y su propia
 * pantalla: viene una lista de que se elimina, donde se hace dentro de la app,
 * y a quien escribirle si ya no se puede entrar.
 *
 * Casi todo es opcional menos la version: si el backend deja de mandar un
 * bloque, esa parte no se dibuja, pero la pantalla sigue abriendo. Google
 * verifica esta URL, asi que romperla entera por un campo seria lo peor.
 */
export const bajaCuentaSchema = z.object({
  tipo: z.string(),
  version: z.string(),
  contacto: z.string().optional(),
  /** El camino dentro de la app, tal cual: "Perfil → Eliminar mi cuenta". */
  enLaApp: z.string().optional(),
  /** Cuanto tarda una baja pedida por correo, para quien perdio el acceso. */
  plazoDiasSolicitudPorEmail: z.number().optional(),
  seElimina: z.array(z.string()).default([]),
});
