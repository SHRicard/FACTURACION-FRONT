import { DateTime } from 'luxon';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { memo, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/ui/atoms/Text';
import { useTheme } from '@/theme';

import { createStyles } from './SelectorFecha.styles';
import type { SelectorFechaProps } from './SelectorFecha.types';

/** Lunes primero, como el calendario de pared de aca. */
const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

const FORMATO = 'yyyy-LL-dd';

/** `aaaa-mm-dd` -> DateTime, o null si no es una fecha. */
function leer(texto: string | null | undefined): DateTime | null {
  if (!texto) return null;
  const fecha = DateTime.fromFormat(texto, FORMATO);
  return fecha.isValid ? fecha : null;
}

/**
 * Un calendario de un mes para elegir un dia.
 *
 * Esta armado con `View` y luxon, sin libreria de fechas: los pickers nativos
 * cambian de forma en cada plataforma (y en web no existen), y lo unico que
 * hace falta aca es tocar un dia. Trabaja con `aaaa-mm-dd` de punta a punta,
 * que es lo que viaja a la API: no hay horas ni zonas que se corran un dia.
 *
 * Es un atom: no sabe para que es la fecha. El minimo lo decide quien lo usa.
 */
function SelectorFechaComponent({
  valor,
  onCambiar,
  minimo,
  accessibilityLabel,
}: SelectorFechaProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const elegido = leer(valor);
  const primero = leer(minimo);
  const hoy = DateTime.now().toFormat(FORMATO);

  // Arranca en el mes de lo elegido; si no hay nada, en el del minimo o el de hoy.
  const [mes, setMes] = useState(() =>
    (elegido ?? primero ?? DateTime.now()).startOf('month'),
  );

  const mesAnterior = mes.minus({ months: 1 });
  // No se va a un mes entero que ya quedo antes del minimo: ahi no hay nada que tocar.
  const puedeRetroceder = !primero || mesAnterior.endOf('month') >= primero;

  const celdas = useMemo(() => {
    // Huecos al principio para que el 1 caiga en su dia de la semana (lunes = 1).
    const huecos = mes.weekday - 1;
    const dias = Array.from({ length: mes.daysInMonth ?? 30 }, (_, i) => mes.plus({ days: i }));
    return [...Array.from({ length: huecos }, () => null), ...dias];
  }, [mes]);

  return (
    <View style={styles.calendario} accessibilityLabel={accessibilityLabel}>
      <View style={styles.encabezado}>
        <Pressable
          onPress={() => setMes(mesAnterior)}
          disabled={!puedeRetroceder}
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          accessibilityState={{ disabled: !puedeRetroceder }}
          style={[styles.flecha, !puedeRetroceder && styles.apagada]}
        >
          <ChevronLeft size={20} color={theme.colors.text} />
        </Pressable>
        <Text variant="body" weight="bold" style={styles.mes} accessibilityRole="header">
          {mes.setLocale('es').toFormat('LLLL yyyy')}
        </Text>
        <Pressable
          onPress={() => setMes(mes.plus({ months: 1 }))}
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          style={styles.flecha}
        >
          <ChevronRight size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      <View style={styles.semana}>
        {DIAS_SEMANA.map((dia, i) => (
          // Las iniciales se repiten (dos M): el indice es la identidad.
          <Text key={i} variant="caption" tone="muted" style={styles.diaSemana}>
            {dia}
          </Text>
        ))}
      </View>

      <View style={styles.grilla}>
        {celdas.map((dia, i) => {
          if (!dia) return <View key={`hueco-${i}`} style={styles.celda} />;

          const texto = dia.toFormat(FORMATO);
          const deshabilitado = primero !== null && dia < primero;
          const esElegido = texto === valor;

          return (
            <View key={texto} style={styles.celda}>
              <Pressable
                onPress={() => onCambiar(texto)}
                disabled={deshabilitado}
                accessibilityRole="button"
                accessibilityLabel={dia.setLocale('es').toFormat("cccc d 'de' LLLL")}
                accessibilityState={{ selected: esElegido, disabled: deshabilitado }}
                style={({ pressed }) => [
                  styles.dia,
                  texto === hoy && styles.hoy,
                  esElegido && styles.elegido,
                  deshabilitado && styles.deshabilitado,
                  pressed && styles.presionado,
                ]}
              >
                <Text
                  variant="body"
                  family="text"
                  weight={esElegido ? 'bold' : 'regular'}
                  tone={esElegido ? 'onPrimary' : 'default'}
                >
                  {dia.day}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export const SelectorFecha = memo(SelectorFechaComponent);
