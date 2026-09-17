import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { Controller, useWatch, type Control } from 'react-hook-form';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

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

/** Tope de la cantidad: un mostrador no despacha mil unidades de algo. */
const CANTIDAD_MAXIMA = 999;

/**
 * Un renglon del ticket: que se lleva, talle, especie, cuantos y a cuanto.
 *
 * La tarjeta va en el fondo de la pantalla y no en `surface`: los campos SI son
 * `surface`, y gris sobre gris no dejaba ver donde empezaba cada uno. Arriba
 * lleva el nombre de lo que se lleva, asi con tres renglones se sabe cual es
 * cual sin leer los campos.
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

  // Solo este campo, para el titulo de la tarjeta: no redibuja el resto.
  const nombre = useWatch({ control, name: `items.${indice}.nombre` });
  const subtotal = subtotalDe(cantidad, precioUnitario);
  const unidades = Number(cantidad) || 0;
  const precio = Number(precioUnitario) || 0;

  return (
    <View style={styles.renglon}>
      <View style={styles.encabezado}>
        <View style={styles.numero}>
          <Text variant="caption" weight="bold" tone="primary">
            {indice + 1}
          </Text>
        </View>
        <Text
          variant="body"
          weight="bold"
          tone={nombre ? 'default' : 'muted'}
          numberOfLines={1}
          style={styles.titulo}
        >
          {nombre || `Artículo ${indice + 1}`}
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
        {/*
          La cantidad con − y +: casi siempre es 1, 2 o 3, y tocar es mas rapido
          que abrir el teclado. El numero se puede escribir igual para los casos
          grandes.
        */}
        <Controller
          control={control}
          name={`items.${indice}.cantidad`}
          render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => {
            const actual = Number(value) || 0;
            const cambiar = (delta: number) =>
              onChange(String(Math.min(CANTIDAD_MAXIMA, Math.max(1, actual + delta))));

            return (
              <View style={styles.campoCantidad}>
                <Text variant="caption" tone="muted">
                  Cantidad *
                </Text>
                <View style={[styles.contador, error ? styles.contadorError : null]}>
                  <Pressable
                    onPress={() => cambiar(-1)}
                    disabled={actual <= 1}
                    hitSlop={theme.spacing.xs}
                    accessibilityRole="button"
                    accessibilityLabel="Uno menos"
                    style={({ pressed }) => [
                      styles.paso,
                      actual <= 1 && styles.pasoApagado,
                      pressed && styles.presionado,
                    ]}
                  >
                    <Minus size={18} color={theme.colors.primary} strokeWidth={2.4} />
                  </Pressable>
                  <TextInput
                    value={value}
                    onChangeText={(texto) => onChange(texto.replace(/\D/g, ''))}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={3}
                    selectTextOnFocus
                    accessibilityLabel="Cantidad"
                    style={styles.cantidad}
                  />
                  <Pressable
                    onPress={() => cambiar(1)}
                    disabled={actual >= CANTIDAD_MAXIMA}
                    hitSlop={theme.spacing.xs}
                    accessibilityRole="button"
                    accessibilityLabel="Uno más"
                    style={({ pressed }) => [styles.paso, pressed && styles.presionado]}
                  >
                    <Plus size={18} color={theme.colors.primary} strokeWidth={2.4} />
                  </Pressable>
                </View>
                {error ? (
                  <Text variant="caption" tone="error">
                    {error.message}
                  </Text>
                ) : null}
              </View>
            );
          }}
        />
        <View style={styles.mitad}>
          <CampoControlado
            control={control}
            name={`items.${indice}.precioUnitario`}
            label="Precio c/u"
            required
            placeholder="50.000"
            monto
            returnKeyType="next"
          />
        </View>
      </View>

      <View style={styles.subtotal}>
        {/* La cuenta a la vista: "3 × $ 3.000" es lo que se controla. */}
        <Text variant="caption" tone="muted">
          {unidades > 0 && precio > 0 ? `${unidades} × ${formatearMoneda(precio)}` : 'Subtotal'}
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
      backgroundColor: theme.colors.background,
    },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      minHeight: 32,
    },
    // El numero del renglon en un circulo: se ubica de un vistazo cual es cual.
    numero: {
      width: theme.spacing.lg,
      height: theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    titulo: { flex: 1 },
    fila: { flexDirection: 'row', gap: theme.spacing.sm },
    mitad: { flex: 1 },
    campoCantidad: { flex: 1, gap: theme.spacing.xs },
    contador: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      paddingHorizontal: theme.spacing.xs,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    contadorError: { borderColor: theme.colors.error },
    paso: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.full,
    },
    pasoApagado: { opacity: 0.3 },
    presionado: { backgroundColor: theme.colors.border },
    cantidad: {
      flex: 1,
      padding: 0,
      textAlign: 'center',
      fontSize: theme.typography.size.body,
      ...theme.typography.family.text.bold,
      color: theme.colors.text,
    },
    subtotal: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm,
    },
  });
