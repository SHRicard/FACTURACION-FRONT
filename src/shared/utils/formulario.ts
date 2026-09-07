import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import type { ErrorApi } from './errorApi';

/**
 * Baja los errores por campo del backend a los inputs del formulario.
 *
 * En un 400 el backend manda `detalles: { campo: motivo }`. Sin esto, "el email
 * ya esta en uso" aparece en el cartel de arriba y la persona tiene que
 * adivinar cual de los cuatro campos arreglar.
 *
 * Los campos que no existen en el formulario se ignoran: react-hook-form
 * registraria un error fantasma que no se muestra en ningun lado y bloquearia
 * el submit para siempre.
 */
export function aplicarDetalles<T extends FieldValues>(
  form: UseFormReturn<T>,
  detalles: ErrorApi['detalles'],
): void {
  if (!detalles) return;

  const campos = new Set(Object.keys(form.getValues()));
  for (const [campo, motivo] of Object.entries(detalles)) {
    if (campos.has(campo)) {
      form.setError(campo as Path<T>, { type: 'server', message: motivo });
    }
  }
}
