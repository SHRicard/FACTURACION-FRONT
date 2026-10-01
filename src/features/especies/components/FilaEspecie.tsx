import { Trash2 } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Badge, BotonIcono, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { textoCantidad } from '../formato';
import type { Especie } from '../types';

interface FilaEspecieProps {
  especie: Especie;
  onEditar: (especie: Especie) => void;
  onAlternar: (especie: Especie) => void;
  onBorrar: (especie: Especie) => void;
}

/**
 * Una fila del listado de especies.
 *
 * Tocar la fila edita; el interruptor prende y apaga sin entrar a ningun lado,
 * que es la accion mas frecuente. Las inactivas se ven igual pero apagadas: se
 * siguen mostrando porque desde aca es de donde se vuelven a prender.
 */
function FilaEspecieComponent({ especie, onEditar, onAlternar, onBorrar }: FilaEspecieProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  // `!== undefined` y no truthy: una cantidad de 0 se muestra, no se esconde.
  const cantidad = especie.cantidad !== undefined ? textoCantidad(especie.cantidad) : null;

  return (
    <Pressable
      onPress={() => onEditar(especie)}
      style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
      accessibilityRole="button"
      accessibilityLabel={`${especie.nombre}${cantidad ? `, ${cantidad}` : ''}${especie.activo ? '' : ', inactiva'}`}
      accessibilityHint="Editar la especie"
    >
      <View style={[styles.datos, !especie.activo && styles.apagado]}>
        <View style={styles.titulo}>
          <Text variant="body" weight="medium" numberOfLines={1} style={styles.nombre}>
            {especie.nombre}
          </Text>
          {/* Ademas de la opacidad, la palabra: apagar solo el color no le dice
              nada a quien no distingue ese gris. */}
          {especie.activo ? null : <Badge label="Inactiva" tone="neutral" />}
        </View>
        {especie.descripcion ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {especie.descripcion}
          </Text>
        ) : null}
        {cantidad ? (
          <Text variant="caption" weight="medium" tone="muted">
            {cantidad}
          </Text>
        ) : null}
      </View>

      <Switch
        value={especie.activo}
        onValueChange={() => onAlternar(especie)}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.background}
        accessibilityLabel={`${especie.activo ? 'Desactivar' : 'Activar'} ${especie.nombre}`}
      />

      <BotonIcono accessibilityLabel={`Borrar ${especie.nombre}`} onPress={() => onBorrar(especie)}>
        <Trash2 size={20} color={theme.colors.error} strokeWidth={1.9} />
      </BotonIcono>
    </Pressable>
  );
}

export const FilaEspecie = memo(FilaEspecieComponent);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      minHeight: 44,
      paddingVertical: theme.spacing.sm,
      paddingLeft: theme.spacing.md,
      paddingRight: theme.spacing.xs,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    presionada: { opacity: 0.7 },
    // `flex: 1` para que un nombre largo se recorte en vez de empujar el
    // interruptor fuera de la pantalla.
    datos: { flex: 1, gap: 2 },
    apagado: { opacity: 0.55 },
    titulo: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    nombre: { flexShrink: 1 },
  });
