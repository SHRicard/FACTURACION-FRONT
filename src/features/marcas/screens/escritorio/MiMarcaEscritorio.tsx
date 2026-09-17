import { EnConstruccion } from '@/shared/ui/atoms';

/**
 * Mi marca en escritorio: todavia no existe.
 *
 * Cuando se construya, el reemplazo es el cuerpo de esta funcion y nada mas:
 * los datos salen de los mismos hooks de la feature, que no se duplican.
 */
export function MiMarcaEscritorio() {
  return (
    <EnConstruccion
      titulo="Mi marca"
      descripcion="Los datos del negocio, lo que mueve y sus dueños, en una vista pensada para pantalla ancha."
    />
  );
}
