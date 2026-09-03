import type { InputProps } from '@/shared/ui/atoms/Input';

export interface InputFieldProps extends Omit<InputProps, 'hasError' | 'rightSlot'> {
  /** Etiqueta visible arriba del campo. Tambien alimenta la a11y. */
  label: string;
  /** Mensaje de error. Si viene, el campo se pinta como invalido. */
  error?: string;
  /** Texto de ayuda debajo del campo. Se oculta cuando hay error. */
  helperText?: string;
  /** Marca el campo como obligatorio (asterisco + a11y). */
  required?: boolean;
}
