/**
 * Clave de idempotencia para guardar plata (tickets y pagos): va en el header
 * `Idempotency-Key` y es UNA por intento de guardado. El hook la reusa en cada
 * reintento, así que si con mala señal el primer envío llegó pero la respuesta
 * no, el segundo le devuelve el mismo ticket o pago en vez de cargarlo dos
 * veces (K1).
 *
 * No hace falta que sea criptográfica: el back la compara solo dentro de una
 * marca, y ahí alcanza con que dos intentos no choquen. Por eso, si el motor
 * no trae `crypto.randomUUID` (Hermes), se arma un UUID v4 con `Math.random`.
 *
 * Siempre cumple el formato que valida el back: /^[A-Za-z0-9_-]{16,64}$/.
 */
export function nuevaClaveIdempotencia(): string {
  const nativa = globalThis.crypto?.randomUUID?.();
  if (nativa) return nativa;

  const aleatoria = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (letra) => {
    const nibble = Math.floor(Math.random() * 16);
    // La 'y' es la variante del UUID: 8, 9, a o b.
    return (letra === 'x' ? nibble : (nibble % 4) + 8).toString(16);
  });

  // El reloj mezclado en el último grupo baja todavía más la chance de choque
  // si `Math.random` arranca con la misma semilla en dos teléfonos.
  const reloj = Date.now().toString(16).padStart(12, '0').slice(-12);
  const ultimo = [...aleatoria.slice(24)]
    .map((digito, i) => (parseInt(digito, 16) ^ parseInt(reloj[i], 16)).toString(16))
    .join('');
  return `${aleatoria.slice(0, 24)}${ultimo}`;
}
