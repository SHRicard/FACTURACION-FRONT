import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { InputField, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { COMBINACIONES, normalizarColor } from '../paleta';
import type { ColoresEnEdicion } from '../types';

interface SelectorColoresProps {
  colores: ColoresEnEdicion;
}

/**
 * Los dos colores de la factura. Primero las combinaciones ya armadas (un
 * toque y listo); para quien tiene los colores de su marca, los dos campos
 * hex a mano.
 *
 * Los colores de las muestras son datos de la marca, no del theme: por eso
 * van en `style` en linea.
 */
export function SelectorColores({ colores }: SelectorColoresProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const actual = {
    primario: normalizarColor(colores.primario),
    secundario: normalizarColor(colores.secundario),
  };
  const elegida = COMBINACIONES.find(
    (combinacion) =>
      combinacion.primario === actual.primario && combinacion.secundario === actual.secundario,
  );
  // Si ya tiene colores propios, arranca con los campos a la vista.
  const [aMano, setAMano] = useState(() => !elegida);

  return (
    <View style={styles.bloque}>
      <View style={styles.combinaciones} accessibilityRole="radiogroup">
        {COMBINACIONES.map((combinacion) => {
          const activa = combinacion === elegida;
          return (
            <Pressable
              key={combinacion.nombre}
              onPress={() =>
                colores.cambiar({
                  primario: combinacion.primario,
                  secundario: combinacion.secundario,
                })
              }
              accessibilityRole="radio"
              accessibilityState={{ selected: activa }}
              accessibilityLabel={`Colores ${combinacion.nombre}`}
              style={({ pressed }) => [
                styles.combinacion,
                activa && styles.combinacionActiva,
                pressed && styles.presionado,
              ]}
            >
              <View style={styles.muestras}>
                <View style={[styles.muestra, { backgroundColor: combinacion.primario }]} />
                <View
                  style={[
                    styles.muestra,
                    styles.muestraEncimada,
                    { backgroundColor: combinacion.secundario },
                  ]}
                />
              </View>
              <Text
                variant="caption"
                weight={activa ? 'bold' : 'regular'}
                tone={activa ? 'primary' : 'muted'}
                numberOfLines={1}
              >
                {combinacion.nombre}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setAMano((visible) => !visible)}
        accessibilityRole="button"
        accessibilityState={{ expanded: aMano }}
        hitSlop={theme.spacing.xs}
        style={styles.alternar}
      >
        <Text variant="caption" weight="bold" tone="primary">
          {aMano ? 'Ocultar los colores a mano' : 'Poner los colores de mi marca'}
        </Text>
      </Pressable>

      {aMano ? (
        <View style={styles.campos}>
          <CampoColor
            etiqueta="Principal"
            ayuda="El nombre, el saldo y los títulos."
            valor={colores.primario}
            error={colores.errores.primario}
            onCambiar={(primario) => colores.cambiar({ primario })}
          />
          <CampoColor
            etiqueta="Acento"
            ayuda="“Saldo a pagar”, los pagos y la barra de lo cobrado."
            valor={colores.secundario}
            error={colores.errores.secundario}
            onCambiar={(secundario) => colores.cambiar({ secundario })}
          />
        </View>
      ) : null}
    </View>
  );
}

interface CampoColorProps {
  etiqueta: string;
  ayuda: string;
  valor: string;
  error?: string;
  onCambiar: (valor: string) => void;
}

/** Un hex a mano, con la muestra del color al lado mientras se escribe. */
function CampoColor({ etiqueta, ayuda, valor, error, onCambiar }: CampoColorProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const color = normalizarColor(valor);

  return (
    <InputField
      label={etiqueta}
      value={valor}
      onChangeText={onCambiar}
      error={error}
      helperText={ayuda}
      placeholder="#1e3a8a"
      autoCapitalize="none"
      autoCorrect={false}
      maxLength={7}
      leftSlot={
        <View
          style={[styles.muestraCampo, color ? { backgroundColor: color } : styles.muestraVacia]}
        />
      }
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bloque: { gap: theme.spacing.sm },
    combinaciones: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    combinacion: {
      width: theme.spacing.xxl + theme.spacing.lg,
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    // Ademas del borde, el nombre en negrita: el estado no va solo por color.
    combinacionActiva: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface },
    presionado: { opacity: 0.6 },
    muestras: { flexDirection: 'row' },
    muestra: {
      width: theme.spacing.lg,
      height: theme.spacing.lg,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    muestraEncimada: { marginLeft: -theme.spacing.sm },
    alternar: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
    campos: { gap: theme.spacing.md },
    muestraCampo: {
      width: theme.spacing.md + theme.spacing.xs,
      height: theme.spacing.md + theme.spacing.xs,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    muestraVacia: { borderStyle: 'dashed' },
  });
