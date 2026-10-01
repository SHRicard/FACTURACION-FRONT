import type { Theme } from '@/theme';

/**
 * El color de una barra, por lo que SIGNIFICA. Sale siempre de los tokens
 * semanticos del theme: asi el grafico acompana al modo oscuro sin tocarlo.
 */
export type TonoMetrica = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

export function colorDeTono(theme: Theme, tono: TonoMetrica): string {
  switch (tono) {
    case 'primary':
      return theme.colors.primary;
    case 'success':
      return theme.colors.success;
    case 'warning':
      return theme.colors.warning;
    case 'error':
      return theme.colors.error;
    default:
      return theme.colors.textMuted;
  }
}
