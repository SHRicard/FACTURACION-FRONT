/**
 * Links de WhatsApp a partir del telefono que cargo el administrador.
 *
 * Es el mismo criterio que usa el backend para el link de la factura: en
 * Argentina el mismo celular se escribe de mil maneras ("11 5555-1234",
 * "011 15 5555-1234", "+54 9 11 5555 1234") y WhatsApp lo quiere en formato
 * internacional de celular: 54 + 9 + caracteristica + numero, sin el 15.
 *
 * Vive en `shared` porque lo usan dos features: las metricas (morosos) y el
 * historial del cliente.
 */

/**
 * Lleva un telefono argentino al formato de wa.me, o null si no se puede.
 *
 * No entiende numeros de otros paises (uno de 10 digitos se toma como
 * argentino) y asume que es un celular: los fijos no usan WhatsApp.
 */
export function normalizarTelefonoAR(telefono?: string | null): string | null {
  if (!telefono) return null;

  let digitos = telefono.replace(/\D/g, '');
  if (digitos.startsWith('00')) digitos = digitos.slice(2);
  if (digitos.startsWith('54')) digitos = digitos.slice(2);
  if (digitos.startsWith('0')) digitos = digitos.slice(1);

  // Ya venia con el 9 de celular: 9 + caracteristica + numero.
  if (digitos.length === 11 && digitos.startsWith('9')) return `54${digitos}`;

  // 12 digitos: tiene el 15 metido despues de la caracteristica. La de Buenos
  // Aires (11) tiene 2 digitos; las del interior, 3 o 4.
  if (digitos.length === 12) {
    const posiciones = digitos.startsWith('11') ? [2] : [3, 4];
    for (const p of posiciones) {
      if (digitos.slice(p, p + 2) === '15') {
        digitos = digitos.slice(0, p) + digitos.slice(p + 2);
        break;
      }
    }
  }

  if (digitos.length === 10) return `549${digitos}`;
  return null;
}

/** El chat con ese numero, sin mensaje escrito: lo escribe quien cobra. */
export const enlaceWhatsApp = (numero: string): string => `https://wa.me/${numero}`;
