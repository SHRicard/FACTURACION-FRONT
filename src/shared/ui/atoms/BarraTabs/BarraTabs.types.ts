import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentType } from 'react';

/** Como se dibuja un tab. La barra no sabe de rutas: recibe esto por props. */
export interface TabDefinido {
  /** Nombre de la ruta del navegador (`index`, `facturas`, ...). */
  ruta: string;
  etiqueta: string;
  /**
   * Icono de lucide. Se dibuja de linea cuando el tab esta apagado y RELLENO
   * cuando esta activo: el estado no se comunica solo con color.
   */
  Icono: ComponentType<{ size: number; color: string; fill?: string; strokeWidth?: number }>;
}

export interface BarraTabsProps extends BottomTabBarProps {
  /** Los tabs EN ORDEN. El orden manda: es el mismo que dibuja el navegador. */
  tabs: readonly TabDefinido[];
}
