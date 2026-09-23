import { useSesion } from '@/features/auth/hooks';

import { PantallaActualizacion } from '../components';
import { useActualizacion } from '../hooks';

/**
 * A dónde va quien tiene un rol o un paso pendiente que esta versión no conoce
 * ('desconocido', ver auth/rutas.ts): no se adivina qué hacer, se pide
 * actualizar.
 *
 * Sin bifurcar: una pantalla centrada sirve igual en móvil y en escritorio,
 * como las de auth. "Salir de la cuenta" aparece solo si hay sesión.
 */
export function ActualizarAppScreen() {
  const { actualizar } = useActualizacion();
  const { usuario, cerrarSesion } = useSesion();

  return (
    <PantallaActualizacion
      titulo="Actualizá la app"
      descripcion="Tu cuenta usa algo que esta versión todavía no conoce. Actualizala desde Google Play para seguir."
      onActualizar={actualizar}
      onSalir={usuario ? cerrarSesion : undefined}
    />
  );
}
