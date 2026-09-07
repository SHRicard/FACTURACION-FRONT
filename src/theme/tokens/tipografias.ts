import { Platform, type TextStyle } from 'react-native';

/** Estilo de fuente listo para aplicar: familia y, solo en web, el peso. */
export type EstiloFuente = {
  fontFamily: string;
  fontWeight?: TextStyle['fontWeight'];
};

export type PesoTipografico = 'regular' | 'medium' | 'bold';

/** Las dos familias que usa la app, con sus tres pesos. */
export type FamiliasTipograficas = {
  /** Titulos y encabezados. */
  display: Record<PesoTipografico, EstiloFuente>;
  /** Texto, formularios y datos. */
  text: Record<PesoTipografico, EstiloFuente>;
};

/** Fallback para web: ahi no existen las fuentes embebidas (eso es solo nativo). */
const STACK_WEB = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';

/**
 * Resuelve una fuente por plataforma.
 *
 * Android la busca por el nombre del ARCHIVO (`Inter_400Regular`); iOS por el
 * PostScript name (`Inter-Regular`): no son iguales. En web se declara igual la
 * familia (por si algun dia se cargan por CSS) seguida del stack del sistema, y
 * ahi si va `fontWeight`, porque una familia cubre todos los pesos.
 */
const fuente = (
  android: string,
  ios: string,
  familiaWeb: string,
  pesoWeb: TextStyle['fontWeight'],
): EstiloFuente =>
  Platform.select<EstiloFuente>({
    android: { fontFamily: android },
    ios: { fontFamily: ios },
    default: { fontFamily: `${familiaWeb}, ${STACK_WEB}`, fontWeight: pesoWeb },
  }) as EstiloFuente;

// ─────────────────────── Familias ───────────────────────
// Un titulo arranca en semibold: una display en 400 se ve desinflada. Por eso
// las variantes `display` mapean `regular` al peso 500/600 de cada familia.

const inter: Record<PesoTipografico, EstiloFuente> = {
  regular: fuente('Inter_400Regular', 'Inter-Regular', 'Inter', '400'),
  medium: fuente('Inter_500Medium', 'Inter-Medium', 'Inter', '500'),
  bold: fuente('Inter_700Bold', 'Inter-Bold', 'Inter', '700'),
};

const poppinsTexto: Record<PesoTipografico, EstiloFuente> = {
  regular: fuente('Poppins_400Regular', 'Poppins-Regular', 'Poppins', '400'),
  medium: fuente('Poppins_500Medium', 'Poppins-Medium', 'Poppins', '500'),
  bold: fuente('Poppins_700Bold', 'Poppins-Bold', 'Poppins', '700'),
};

const poppinsTitulo: Record<PesoTipografico, EstiloFuente> = {
  regular: fuente('Poppins_600SemiBold', 'Poppins-SemiBold', 'Poppins', '600'),
  medium: fuente('Poppins_600SemiBold', 'Poppins-SemiBold', 'Poppins', '600'),
  bold: fuente('Poppins_700Bold', 'Poppins-Bold', 'Poppins', '700'),
};

const montserratTitulo: Record<PesoTipografico, EstiloFuente> = {
  regular: fuente('Montserrat_600SemiBold', 'Montserrat-SemiBold', 'Montserrat', '600'),
  medium: fuente('Montserrat_600SemiBold', 'Montserrat-SemiBold', 'Montserrat', '600'),
  bold: fuente('Montserrat_700Bold', 'Montserrat-Bold', 'Montserrat', '700'),
};

const openSans: Record<PesoTipografico, EstiloFuente> = {
  regular: fuente('OpenSans_400Regular', 'OpenSans-Regular', '"Open Sans"', '400'),
  medium: fuente('OpenSans_600SemiBold', 'OpenSans-SemiBold', '"Open Sans"', '600'),
  bold: fuente('OpenSans_700Bold', 'OpenSans-Bold', '"Open Sans"', '700'),
};

const roboto: Record<PesoTipografico, EstiloFuente> = {
  regular: fuente('Roboto_400Regular', 'Roboto-Regular', 'Roboto', '400'),
  medium: fuente('Roboto_500Medium', 'Roboto-Medium', 'Roboto', '500'),
  bold: fuente('Roboto_700Bold', 'Roboto-Bold', 'Roboto', '700'),
};

const robotoTitulo: Record<PesoTipografico, EstiloFuente> = {
  regular: fuente('Roboto_500Medium', 'Roboto-Medium', 'Roboto', '500'),
  medium: fuente('Roboto_500Medium', 'Roboto-Medium', 'Roboto', '500'),
  bold: fuente('Roboto_700Bold', 'Roboto-Bold', 'Roboto', '700'),
};

const loraTitulo: Record<PesoTipografico, EstiloFuente> = {
  regular: fuente('Lora_600SemiBold', 'Lora-SemiBold', 'Lora', '600'),
  medium: fuente('Lora_600SemiBold', 'Lora-SemiBold', 'Lora', '600'),
  bold: fuente('Lora_700Bold', 'Lora-Bold', 'Lora', '700'),
};

// ─────────────────────── Pares ───────────────────────

export type ParTipografico = {
  /** Como se muestra en el selector. */
  nombre: string;
  /** Para que sirve / que transmite. Lo lee el cliente al elegir. */
  descripcion: string;
  family: FamiliasTipograficas;
};

/**
 * Combinaciones curadas de titulo + texto.
 *
 * Son pares y no familias sueltas a proposito: el cliente elige UNA opcion ya
 * balanceada, en vez de poder combinar dos fuentes que pelean entre si.
 */
export const paresTipograficos = {
  'poppins-inter': {
    nombre: 'Poppins + Inter',
    descripcion: 'Titulos con caracter y datos muy legibles. Es la opcion por defecto.',
    family: { display: poppinsTitulo, text: inter },
  },
  'montserrat-open-sans': {
    nombre: 'Montserrat + Open Sans',
    descripcion: 'Mas corporativa y ancha. Clasica para empresas.',
    family: { display: montserratTitulo, text: openSans },
  },
  roboto: {
    nombre: 'Roboto',
    descripcion: 'La de Android. Neutra, no llama la atencion, siempre funciona.',
    family: { display: robotoTitulo, text: roboto },
  },
  'lora-inter': {
    nombre: 'Lora + Inter',
    descripcion:
      'Titulos con serifas: transmite formalidad y oficio. Buena para estudios contables.',
    family: { display: loraTitulo, text: inter },
  },
  poppins: {
    nombre: 'Poppins',
    descripcion: 'Una sola familia geometrica, redondeada y moderna. La mas informal.',
    family: { display: poppinsTitulo, text: poppinsTexto },
  },
} as const satisfies Record<string, ParTipografico>;

export type ClaveParTipografico = keyof typeof paresTipograficos;

export const PAR_TIPOGRAFICO_POR_DEFECTO: ClaveParTipografico = 'poppins-inter';

/** Las claves, en el orden en que se muestran en el selector. */
export const CLAVES_PARES = Object.keys(paresTipograficos) as ClaveParTipografico[];

export function esClaveParTipografico(valor: unknown): valor is ClaveParTipografico {
  return typeof valor === 'string' && valor in paresTipograficos;
}
