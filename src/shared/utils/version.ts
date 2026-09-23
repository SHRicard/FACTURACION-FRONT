/**
 * Comparación de versiones 'mayor.menor.parche' (K8).
 *
 * Sin imports a propósito: se puede probar con node sin levantar la app.
 */

/** Los tres segmentos numéricos; los que faltan valen 0 ('1.2' = '1.2.0'). */
function segmentos(v: string): [number, number, number] | null {
  const partes = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(v.trim());
  if (!partes) return null;
  return [Number(partes[1]), Number(partes[2] ?? 0), Number(partes[3] ?? 0)];
}

/**
 * -1 si `a` es menor que `b`, 0 si son iguales y 1 si es mayor. Compara mayor,
 * menor y parche en ese orden, como números ('1.10.0' > '1.9.9').
 *
 * Misma regla que el back: si alguna de las dos no se entiende (un sufijo
 * '-beta', texto suelto) devuelve null, y una versión que no se entiende NO
 * bloquea. Mejor dejar pasar una build rara que trabar a alguien por un
 * formato que no previmos.
 */
export function compararVersiones(a: string, b: string): -1 | 0 | 1 | null {
  const x = segmentos(a);
  const y = segmentos(b);
  if (!x || !y) return null;

  for (let i = 0; i < 3; i += 1) {
    if (x[i] < y[i]) return -1;
    if (x[i] > y[i]) return 1;
  }
  return 0;
}
