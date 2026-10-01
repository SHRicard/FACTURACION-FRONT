/**
 * Los colores de la marca: leerlos como los escribe la persona, y la MISMA
 * cuenta que hace el backend para el PDF (`src/pdf/paleta.ts` y
 * `src/utils/colores.ts` del backend). Asi la vista previa muestra lo que de
 * verdad recibe el cliente. Si el backend cambia la cuenta, cambia aca.
 *
 * ⚠️ Estos hex NO son colores de la app (esos viven en el theme y se piden con
 * `useTheme`): son datos de la marca, como su nombre o su logo.
 */

/** El papel del PDF: blanco siempre, sea cual sea el modo de la app. */
export const BLANCO_PAPEL = '#ffffff';

/** Los textos del PDF que no son de la marca (el nombre del cliente). */
export const TEXTO_PAPEL = '#6b7280';

const NEGRO = '#000000';

/** "#abc", "1E3A8A", " #1e3a8a " → "#1e3a8a". Null si no es un hex. Igual que el backend. */
export function normalizarColor(crudo: string): string | null {
  const hex = crudo.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(hex)) {
    return `#${[...hex].map((caracter) => caracter + caracter).join('')}`;
  }
  return /^[0-9a-f]{6}$/.test(hex) ? `#${hex}` : null;
}

const canales = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

/** Mezcla dos colores `#rrggbb`. t=0 devuelve el primero, t=1 el segundo. */
function mezclar(desde: string, hasta: string, t: number): string {
  const [r1, g1, b1] = canales(desde);
  const [r2, g2, b2] = canales(hasta);
  const canal = (a: number, b: number) =>
    Math.round(a + (b - a) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${canal(r1, r2)}${canal(g1, g2)}${canal(b1, b2)}`;
}

const lineal = (valor: number) => {
  const c = valor / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** Luminancia relativa, como la define WCAG 2. */
function luminancia(hex: string): number {
  const [r, g, b] = canales(hex);
  return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
}

/** Contraste WCAG entre dos colores: de 1 (iguales) a 21 (negro sobre blanco). */
function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** El mismo color, oscurecido lo justo para llegar a `minimo` de contraste sobre blanco. */
function legibleSobreBlanco(hex: string, minimo = 4.5): string {
  for (let paso = 0; paso <= 20; paso++) {
    const candidato = mezclar(hex, NEGRO, paso / 20);
    if (contraste(candidato, BLANCO_PAPEL) >= minimo) return candidato;
  }
  return NEGRO;
}

/** Los colores con que sale el PDF. */
export interface PaletaFactura {
  /** Nombre de la marca, saldo grande, titulos. */
  primario: string;
  /** "SALDO A PAGAR", montos de los pagos. */
  secundario: string;
  /** La barra de lo cobrado. */
  relleno: string;
  /** Fondo y borde del bloque del saldo: tintes del primario. */
  panel: string;
  borde: string;
}

/** Sin colores elegidos: los violetas de la app, igual que el backend. */
const PALETA_DE_LA_APP: PaletaFactura = {
  primario: '#4a1866',
  secundario: '#762a9d',
  relleno: '#762a9d',
  panel: '#f9f5fc',
  borde: '#e8ddf0',
};

export const COLORES_DE_LA_APP = {
  primario: PALETA_DE_LA_APP.primario,
  secundario: PALETA_DE_LA_APP.secundario,
} as const;

/**
 * La paleta del PDF a partir de los colores de la marca (ya normalizados).
 * Con uno solo, el otro toma el mismo. Lo que va como texto se oscurece hasta
 * leerse sobre blanco; la barra conserva el color, salvo que se pierda.
 */
export function paletaFactura(colores: {
  primario: string | null;
  secundario: string | null;
}): PaletaFactura {
  if (!colores.primario && !colores.secundario) return PALETA_DE_LA_APP;

  const base = colores.primario ?? PALETA_DE_LA_APP.primario;
  const acento = colores.secundario ?? base;
  const primario = legibleSobreBlanco(base);

  return {
    primario,
    secundario: legibleSobreBlanco(acento),
    relleno: contraste(acento, BLANCO_PAPEL) >= 1.5 ? acento : legibleSobreBlanco(acento, 1.5),
    panel: mezclar(primario, BLANCO_PAPEL, 0.95),
    borde: mezclar(primario, BLANCO_PAPEL, 0.82),
  };
}

export interface CombinacionColores {
  nombre: string;
  primario: string;
  secundario: string;
}

const AZUL: CombinacionColores = { nombre: 'Azul', primario: '#1e3a8a', secundario: '#f59e0b' };

/** Pares ya armados: un toque y la factura queda prolija. Cada uno se lee sobre blanco. */
export const COMBINACIONES: readonly CombinacionColores[] = [
  AZUL,
  { nombre: 'Verde', primario: '#14532d', secundario: '#16a34a' },
  { nombre: 'Rojo', primario: '#7f1d1d', secundario: '#dc2626' },
  { nombre: 'Rosa', primario: '#831843', secundario: '#ec4899' },
  { nombre: 'Turquesa', primario: '#134e4a', secundario: '#14b8a6' },
  { nombre: 'Naranja', primario: '#7c2d12', secundario: '#f97316' },
  { nombre: 'Grafito', primario: '#1f2937', secundario: '#6b7280' },
  { nombre: 'Violeta', primario: '#4a1866', secundario: '#762a9d' },
];

/**
 * Con la que arranca el alta. No es el violeta de la app a proposito: asi
 * nadie queda con los colores de la app por no tocar el selector.
 */
export const COMBINACION_INICIAL = AZUL;
