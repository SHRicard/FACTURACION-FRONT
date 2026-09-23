import { get, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';

import type { ErrorApi } from './errorApi';

/**
 * Baja los errores por campo del backend a los inputs del formulario.
 *
 * En un 400 el backend manda `detalles.campos: { ruta: motivo }`, con la ruta
 * de React Hook Form: `dni`, o `items.0.precioUnitario` para un renglón. Sin
 * esto, "el email ya esta en uso" aparece en el cartel de arriba y la persona
 * tiene que adivinar cual de los cuatro campos arreglar.
 *
 * Devuelve si aplicó al menos uno: así el hook decide si además muestra el
 * cartel general (si ninguno bajó a un input, el mensaje no se puede perder).
 *
 * Las rutas que no existen en el formulario se ignoran: react-hook-form
 * registraria un error fantasma que no se muestra en ningun lado y bloquearia
 * el submit para siempre.
 */
export function aplicarDetalles<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: ErrorApi | null,
): boolean {
  if (!error?.campos) return false;

  const valores = form.getValues();
  let aplicado = false;
  for (const [ruta, motivo] of Object.entries(error.campos)) {
    // `get` entiende rutas con punto: 'items.0.precioUnitario' llega al renglón.
    if (get(valores, ruta) === undefined) continue;
    form.setError(ruta as Path<T>, { type: 'server', message: motivo });
    aplicado = true;
  }
  return aplicado;
}
