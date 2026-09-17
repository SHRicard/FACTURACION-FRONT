const SEGMENTO_SUBIDA = '/image/upload/';

/** 3x cubre las pantallas de los telefonos de hoy. */
const DENSIDAD_MAXIMA = 3;

/** Lo guardado nunca pasa de esto (el backend lo achica al subir): pedir mas no suma nada. */
const LADO_MAXIMO_GUARDADO = 1000;

/**
 * Una imagen de Cloudinary al tamaño en que se muestra, en WEBP.
 *
 * Lo guardado es el original de hasta 1000×1000, en el formato en que se
 * subio: para un circulo de 64 puntos es bajar hasta un MB de mas. Cloudinary
 * arma la variante al vuelo si se la pide en la URL, igual que hace el backend
 * con el PDF (`c_limit,w_440,h_160,f_png`).
 *
 * - WEBP y no PNG: pesa bastante menos y conserva la transparencia; Android,
 *   iOS y los navegadores lo muestran. El PDF y el mail no pasan por aca: el
 *   backend les pide PNG aparte, porque pdfmake no lee WEBP.
 * - `f_webp` y no `f_auto`: `f_auto` decide por los headers del pedido, y el
 *   de la app nativa no es un navegador.
 * - A 3x del lado en pantalla y no a la densidad exacta del telefono: asi hay
 *   una sola variante por lugar, que Cloudinary genera una vez y sirve
 *   cacheada a todos. `c_limit` solo achica: un logo chico no se agranda.
 *
 * Una URL que no es de Cloudinary (la foto de Google de un dueño) vuelve igual.
 */
export function imagenAlTamano(url: string | undefined, lado: number): string | undefined {
  if (!url?.includes('res.cloudinary.com') || !url.includes(SEGMENTO_SUBIDA)) return url;

  const pixeles = Math.min(Math.ceil(lado * DENSIDAD_MAXIMA), LADO_MAXIMO_GUARDADO);
  return url.replace(
    SEGMENTO_SUBIDA,
    `${SEGMENTO_SUBIDA}c_limit,w_${pixeles},h_${pixeles},f_webp,q_auto/`,
  );
}
