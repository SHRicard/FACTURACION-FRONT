import { Construction } from 'lucide-react-native';
import { memo } from 'react';

import { useTheme } from '@/theme';

import { EstadoVacio } from '../EstadoVacio';
import { Pantalla } from '../Pantalla';
import type { EnConstruccionProps } from './EnConstruccion.types';

/**
 * El lugar de una pantalla que todavia no existe.
 *
 * Hoy lo usan las vistas de ESCRITORIO: la app esta hecha para telefono y el
 * escritorio va a ser otra composicion, no la misma estirada. Mientras tanto,
 * una ventana ancha muestra esto en vez de un layout movil desparramado.
 *
 * Dice como seguir trabajando —achicar la ventana— porque un cartel que solo
 * frena, sin decir por donde salir, se lee como que la app se rompio.
 */
function EnConstruccionComponent({ titulo, descripcion }: EnConstruccionProps) {
  const theme = useTheme();

  return (
    <Pantalla titulo={titulo} descripcion="Vista de escritorio">
      <EstadoVacio
        icono={<Construction size={theme.typography.size.heading} color={theme.colors.textMuted} />}
        titulo="En construcción"
        descripcion={
          descripcion ??
          'Esta pantalla todavía no tiene su versión de escritorio. Achicá la ventana y seguís con la vista móvil, que sí está lista.'
        }
      />
    </Pantalla>
  );
}

export const EnConstruccion = memo(EnConstruccionComponent);
