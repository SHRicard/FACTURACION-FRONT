import { CircleArrowUp, Megaphone, Sparkles, Wrench } from 'lucide-react-native';
import type { ComponentType } from 'react';

import type { BadgeTone } from '@/shared/ui/atoms';

import type { TipoAviso } from './types';

interface PresentacionTipo {
  etiqueta: string;
  Icono: ComponentType<{ size: number; color: string }>;
  tono: BadgeTone;
}

/**
 * Como se ve cada tipo de aviso. Lo usan la pantalla de avisos de la app y el
 * panel del super_admin (la vista previa), asi los dos lo muestran igual.
 */
export const PRESENTACION_TIPO: Record<TipoAviso, PresentacionTipo> = {
  novedad: { etiqueta: 'Novedad', Icono: Sparkles, tono: 'primary' },
  mantenimiento: { etiqueta: 'Mantenimiento', Icono: Wrench, tono: 'warning' },
  version: { etiqueta: 'Versión nueva', Icono: CircleArrowUp, tono: 'success' },
  aviso: { etiqueta: 'Aviso', Icono: Megaphone, tono: 'neutral' },
};

/** El orden en que se ofrecen al redactar. */
export const TIPOS_AVISO: readonly TipoAviso[] = ['novedad', 'mantenimiento', 'version', 'aviso'];
