import { ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/shared/ui/atoms';
import { formatearMoneda, formatearVentanaPago } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { ClienteEnLista } from '../types';

interface FilaClienteProps {
  cliente: ClienteEnLista;
  onPress: (id: string) => void;
}

/**
 * Una fila del listado de clientes.
 *
 * Memoizada porque la lista puede ser larga y el buscador la re-renderiza en
 * cada tecla: sin esto se vuelven a dibujar las 20 filas por letra escrita.
 */
function FilaClienteComponent({ cliente, onPress }: FilaClienteProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const debe = cliente.deuda > 0;
  const tieneVencidas = cliente.facturasVencidas > 0;
  // `limiteCredito` 0 significa "sin limite", asi que nunca se pasa.
  const superaLimite = cliente.limiteCredito > 0 && cliente.deuda > cliente.limiteCredito;

  // Los datos secundarios se juntan en una linea: en un telefono no entra una
  // fila por dato, y el DNI es lo que identifica al cliente.
  const secundario = [`DNI ${cliente.dni}`, cliente.telefono].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={() => onPress(cliente.id)}
      style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
      accessibilityRole="button"
      accessibilityLabel={`${cliente.nombre}, ${secundario}, debe ${formatearMoneda(cliente.deuda)}`}
    >
      <View style={styles.datos}>
        <Text variant="body" weight="medium" numberOfLines={1}>
          {cliente.nombre}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {secundario}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          Paga {formatearVentanaPago(cliente.ventanaPago.desdeDia, cliente.ventanaPago.hastaDia)}
        </Text>

        {/* Cada alerta lleva TEXTO, no solo un color: un monto en rojo no le
            dice nada a quien no distingue el rojo del gris. */}
        {tieneVencidas || superaLimite ? (
          <View style={styles.avisos}>
            {tieneVencidas ? (
              <Badge
                label={`${cliente.facturasVencidas} vencida${cliente.facturasVencidas === 1 ? '' : 's'}`}
                tone="error"
              />
            ) : null}
            {superaLimite ? <Badge label="Supera el limite" tone="warning" /> : null}
          </View>
        ) : null}
      </View>

      <View style={styles.montos}>
        <Text
          variant="body"
          weight={debe ? 'bold' : 'regular'}
          family="text"
          tone={tieneVencidas ? 'error' : debe ? 'default' : 'muted'}
        >
          {formatearMoneda(cliente.deuda)}
        </Text>
        <Text variant="caption" tone="muted">
          {debe ? 'debe' : 'al dia'}
        </Text>
      </View>

      <ChevronRight size={20} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export const FilaCliente = memo(FilaClienteComponent);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      minHeight: 44,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    presionada: { opacity: 0.7 },
    // `flex: 1` para que un nombre largo se recorte en vez de empujar el monto.
    datos: { flex: 1, gap: 2 },
    avisos: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, marginTop: 2 },
    montos: { alignItems: 'flex-end' },
  });
