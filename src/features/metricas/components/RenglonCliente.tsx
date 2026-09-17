import { ChevronRight } from 'lucide-react-native';
import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, type TextTone } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import type { ClienteMetrica } from '../types';

interface RenglonClienteProps {
  /** `null` si el cliente ya no existe: el renglon se ve pero no lleva a ningun lado. */
  cliente: ClienteMetrica | null;
  /** El lugar en el ranking, si la lista es un ranking. */
  posicion?: number;
  /** Lo que se dice del cliente debajo del nombre, una linea cada uno. */
  lineas?: readonly (string | null | undefined)[];
  /** El numero de la derecha, ya formateado. */
  valor: string;
  /** Que es ese numero ("debe", "comprado"). */
  detalleValor?: string;
  tonoValor?: TextTone;
  /** Chips debajo de las lineas ("97 días", "Demorado"). */
  avisos?: ReactNode;
  onPress: (clienteId: string) => void;
}

/**
 * Un cliente en una lista de metricas: quien es, lo que la metrica dice de el y
 * un numero. Tocarlo abre su ficha, donde estan el boton de WhatsApp y la
 * cuenta.
 *
 * Memoizado porque las listas pueden ser largas y el buscador re-renderiza la
 * pantalla en cada tecla.
 */
function RenglonClienteComponent({
  cliente,
  posicion,
  lineas = [],
  valor,
  detalleValor,
  tonoValor = 'default',
  avisos,
  onPress,
}: RenglonClienteProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const nombre = cliente?.nombre ?? 'Cliente eliminado';
  const secundarias = [cliente ? `DNI ${cliente.dni}` : null, ...lineas].filter(
    (linea): linea is string => Boolean(linea),
  );

  const etiquetaAccesible = [
    posicion ? `Puesto ${posicion}` : null,
    nombre,
    ...secundarias,
    [detalleValor, valor].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={cliente ? () => onPress(cliente.id) : undefined}
      disabled={!cliente}
      style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
      accessibilityRole={cliente ? 'button' : 'text'}
      accessibilityLabel={etiquetaAccesible}
    >
      {posicion ? (
        <Text variant="body" weight="bold" family="text" tone="muted" style={styles.posicion}>
          {posicion}
        </Text>
      ) : null}

      <View style={styles.datos}>
        <Text variant="body" weight="medium" numberOfLines={1} tone={cliente ? 'default' : 'muted'}>
          {nombre}
        </Text>
        {secundarias.map((linea) => (
          <Text key={linea} variant="caption" tone="muted" numberOfLines={1}>
            {linea}
          </Text>
        ))}
        {avisos ? <View style={styles.avisos}>{avisos}</View> : null}
      </View>

      <View style={styles.montos}>
        <Text variant="body" weight="bold" family="text" tone={tonoValor}>
          {valor}
        </Text>
        {detalleValor ? (
          <Text variant="caption" tone="muted">
            {detalleValor}
          </Text>
        ) : null}
      </View>

      {cliente ? <ChevronRight size={20} color={theme.colors.textMuted} /> : null}
    </Pressable>
  );
}

export const RenglonCliente = memo(RenglonClienteComponent);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      minHeight: 44,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    presionada: { opacity: 0.7 },
    // Ancho fijo: si no, el 9 y el 10 corren el nombre a alturas distintas.
    posicion: { minWidth: theme.spacing.lg, textAlign: 'center' },
    // `flex: 1` para que un nombre largo se recorte en vez de empujar el monto.
    datos: { flex: 1, gap: 2 },
    avisos: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, marginTop: 2 },
    montos: { alignItems: 'flex-end' },
  });
