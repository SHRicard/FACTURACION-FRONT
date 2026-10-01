import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GraficoBarras, Pestanas, type PuntoGrafico } from '@/features/metricas/components';
import { mesCorto } from '@/features/metricas/formato';
import type { Opcion } from '@/features/metricas/types';
import { Text } from '@/shared/ui/atoms';
import { contar, formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { Crecimiento, TramoCrecimiento } from '../types';

/** Que mira el grafico: altas, uso o plata (docs/SUPER_ADMIN.md, 4). */
type Vista = 'altas' | 'uso' | 'plata';

const VISTAS: readonly Opcion<Vista>[] = [
  { clave: 'altas', etiqueta: 'Altas' },
  { clave: 'uso', etiqueta: 'Uso' },
  { clave: 'plata', etiqueta: 'Plata' },
];

/** `'2026-09-23'` -> `'23/09'`; `'2026-09'` -> `'sep'`. */
function etiquetaDe(periodo: string, agrupar: Crecimiento['agrupar']): string {
  if (agrupar === 'mes') return mesCorto(periodo);
  const [, mes, dia] = periodo.split('-');
  return dia && mes ? `${dia}/${mes}` : periodo;
}

/** La barra de cada vista: lo que suma, y como se lee el tramo entero. */
const VALOR: Record<Vista, (tramo: TramoCrecimiento) => number> = {
  altas: (tramo) => tramo.usuarios + tramo.marcas,
  uso: (tramo) => tramo.tickets + tramo.pagos,
  plata: (tramo) => tramo.vendido,
};

function describir(vista: Vista, tramo: Omit<TramoCrecimiento, 'periodo'>): string {
  switch (vista) {
    case 'altas':
      return `${contar(tramo.usuarios, 'cuenta nueva', 'cuentas nuevas')} · ${contar(tramo.marcas, 'marca nueva', 'marcas nuevas')}`;
    case 'uso':
      return `${contar(tramo.tickets, 'ticket', 'tickets')} · ${contar(tramo.pagos, 'pago', 'pagos')}`;
    default:
      return `Vendido ${formatearMoneda(tramo.vendido)} · cobrado ${formatearMoneda(tramo.cobrado)}`;
  }
}

interface GraficoCrecimientoProps {
  crecimiento: Crecimiento;
}

/**
 * La serie de `/admin/crecimiento` en barras, con tres lecturas: altas
 * (cuentas + marcas), uso (tickets + pagos) y plata (vendido). Tocar una barra
 * muestra el detalle de ese tramo; sin tocar nada, el total del rango.
 *
 * Los tramos en 0 van igual: un hueco dice algo.
 */
export function GraficoCrecimiento({ crecimiento }: GraficoCrecimientoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [vista, setVista] = useState<Vista>('altas');
  const [elegido, setElegido] = useState<string | null>(null);

  const puntos: PuntoGrafico[] = useMemo(
    () =>
      crecimiento.serie.map((tramo) => ({
        clave: tramo.periodo,
        etiqueta: etiquetaDe(tramo.periodo, crecimiento.agrupar),
        valor: VALOR[vista](tramo),
        descripcion: `${tramo.periodo}: ${describir(vista, tramo)}`,
      })),
    [crecimiento, vista],
  );

  const tramoElegido = crecimiento.serie.find((tramo) => tramo.periodo === elegido);

  return (
    <View style={styles.bloque}>
      <Pestanas opciones={VISTAS} activa={vista} onCambiar={setVista} />
      <GraficoBarras
        puntos={puntos}
        tono={vista === 'plata' ? 'success' : 'primary'}
        elegida={elegido}
        onElegir={(clave) => setElegido((actual) => (actual === clave ? null : clave))}
      />
      <Text variant="caption" tone="muted">
        {tramoElegido
          ? `${tramoElegido.periodo}: ${describir(vista, tramoElegido)}`
          : `Total del rango: ${describir(vista, crecimiento.totales)}`}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bloque: { gap: theme.spacing.sm },
  });
