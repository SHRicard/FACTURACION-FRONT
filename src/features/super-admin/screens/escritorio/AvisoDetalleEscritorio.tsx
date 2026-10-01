import { EnConstruccion } from '@/shared/ui/atoms';

/**
 * Aviso en escritorio: todavia no existe.
 *
 * Cuando se construya, el reemplazo es el cuerpo de esta funcion y nada mas:
 * los datos salen de los mismos hooks de la feature, que no se duplican.
 */
export function AvisoDetalleEscritorio() {
  return <EnConstruccion titulo="Aviso" />;
}
