import { Platform, type TextStyle } from 'react-native';

/** Estilo de fuente listo para aplicar: familia y, si hace falta, peso. */
export type EstiloFuente = {
  fontFamily: string;
  fontWeight?: TextStyle['fontWeight'];
};

/**
 * Stack del sistema para web. En web NO existen las fuentes embebidas por el
 * config plugin de expo-font (eso es solo nativo), asi que sin esto el navegador
 * cae a su default, que es una serif tipo Times.
 */
const STACK_WEB = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';

/**
 * Resuelve el nombre de la fuente por plataforma.
 *
 * Android la busca por el nombre del ARCHIVO (`Inter_400Regular`) e iOS por el
 * PostScript name (`Inter-Regular`): no son iguales. En web se usa el stack del
 * sistema y ahi si hace falta `fontWeight`, porque una sola familia cubre todos
 * los pesos.
 */
const fuente = (android: string, ios: string, pesoWeb: TextStyle['fontWeight']): EstiloFuente =>
  Platform.select<EstiloFuente>({
    android: { fontFamily: android },
    ios: { fontFamily: ios },
    default: { fontFamily: STACK_WEB, fontWeight: pesoWeb },
  }) as EstiloFuente;

export const typography = {
  size: {
    caption: 12,
    body: 16,
    title: 22,
    heading: 28,
  },

  /**
   * Familias tipograficas.
   *
   * ⚠️ En NATIVO cada combinacion (familia, peso) es un ARCHIVO distinto, por eso
   * ahi no se manda `fontWeight`: si lo haces, Android engorda el archivo regular
   * por software y queda un bold falso y sucio. El peso se elige cambiando de
   * archivo. En web es al reves: una familia y el peso por CSS.
   *
   * - `text`    → Inter. Texto, formularios y datos. Tiene cifras tabulares,
   *               asi que los montos se alinean en columna.
   * - `display` → Poppins. Titulos y encabezados.
   */
  family: {
    text: {
      regular: fuente('Inter_400Regular', 'Inter-Regular', '400'),
      medium: fuente('Inter_500Medium', 'Inter-Medium', '500'),
      bold: fuente('Inter_700Bold', 'Inter-Bold', '700'),
    },
    display: {
      // El peso base de un titulo ya es semibold: Poppins 400 en un heading se
      // ve desinflado, por eso `regular` apunta al SemiBold.
      regular: fuente('Poppins_600SemiBold', 'Poppins-SemiBold', '600'),
      medium: fuente('Poppins_600SemiBold', 'Poppins-SemiBold', '600'),
      bold: fuente('Poppins_700Bold', 'Poppins-Bold', '700'),
    },
  },
} as const;

export type Typography = typeof typography;
