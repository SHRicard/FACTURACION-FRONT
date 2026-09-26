import { EnConstruccion } from '@/shared/ui/atoms';

/**
 * Nuevo aviso en escritorio: todavia no existe.
 *
 * Cuando se construya, el reemplazo es el cuerpo de esta funcion y nada mas:
 * los datos salen de los mismos hooks de la feature, que no se duplican.
 */
export function NuevoAvisoEscritorio() {
  return <EnConstruccion titulo="Nuevo aviso" />;
}
