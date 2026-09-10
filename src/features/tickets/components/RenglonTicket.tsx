import { Trash2 } from 'lucide-react-native';
import { Controller, type Control } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import type { Especie } from '@/features/especies/types';
import { BotonIcono, CampoControlado, Text } from '@/shared/ui/atoms';
import { formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { subtotalDe } from '../schemas';
import type { TicketForm } from '../types';

import { SelectorEspecie } from './SelectorEspecie';

interface RenglonTicketProps {
  control: Control<TicketForm>;
  indice: number;
  especies: readonly Especie[];
  /** Lo que suma este renglon, ya calculado por la pantalla. */
  cantidad: string;
  precioUnitario: string;
  onQuitar: (indice: number) => void;
  puedeQuitar: boolean;
}

/**
 * Un renglon del ticket: que se lleva, talle, especie, cuantos y a cuanto.
 *
 * El subtotal se actualiza mientras se escribe, que es lo que deja controlar la
 * cuenta sin sacar la calculadora.
 */
export function RenglonTicket({
  control,
  indice,
  especies,
  cantidad,
  precioUnitario,
  onQuitar,
  puedeQuitar,
}: RenglonTicketProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const subtotal = subtotalDe(cantidad, precioUnitario);

  return (
    <View style={styles.renglon}>
      <View style={styles.encabezado}>
        <Text variant="caption" tone="muted">
          Renglón {indice + 1}
        </Text>
        {/* El ultimo no se borra: un ticket sin items no existe. */}
        {puedeQuitar ? (
          <BotonIcono
            accessibilityLabel={`Quitar el renglón ${indice + 1}`}
            onPress={() => onQuitar(indice)}
          >
            <Trash2 size={18} color={theme.colors.error} strokeWidth={1.9} />
          </BotonIcono>
        ) : null}
      </View>

      <CampoControlado
        control={control}
        name={`items.${indice}.nombre`}
        label="Qué se lleva"
        required
        placeholder="Pantalón largo"
        autoCapitalize="sentences"
        returnKeyType="next"
      />

      <View style={styles.fila}>
        <View style={styles.mitad}>
          <CampoControlado
            control={control}
            name={`items.${indice}.talle`}
            label="Talle"
            placeholder="34, M, XL"
            autoCapitalize="characters"
            returnKeyType="next"
          />
        </View>
        <View style={styles.mitad}>
          {/* El selector no es un TextInput, asi que no puede ir por
              `CampoControlado`: se conecta con su propio Controller. */}
          <Controller
            control={control}
            name={`items.${indice}.especie`}
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <SelectorEspecie
                especies={especies}
                valor={value}
                onCambiar={onChange}
                error={error?.message}
              />
            )}
          />
        </View>
      </View>

      <View style={styles.fila}>
        <View style={styles.mitad}>
          <CampoControlado
            control={control}
            name={`items.${indice}.cantidad`}
            label="Cantidad"
            required
            keyboardType="number-pad"
            returnKeyType="next"
          />
        </View>
        <View style={styles.mitad}>
          <CampoControlado
            control={control}
            name={`items.${indice}.precioUnitario`}
            label="Precio c/u"
            required
            placeholder="50000"
            keyboardType="number-pad"
            returnKeyType="next"
          />
        </View>
      </View>

      <View style={styles.subtotal}>
        <Text variant="caption" tone="muted">
          Subtotal
        </Text>
        <Text variant="body" weight="bold" family="text">
          {formatearMoneda(subtotal)}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    renglon: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 24,
    },
    fila: { flexDirection: 'row', gap: theme.spacing.sm },
    mitad: { flex: 1 },
    subtotal: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm,
    },
  });
