import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { COLORES_DE_LA_APP } from '../paleta';

import { VistaPreviaColores } from './VistaPreviaColores';

interface SeccionColoresProps {
  nombreMarca: string;
  colorPrimario?: string;
  colorSecundario?: string;
  onCambiar: () => void;
}

/** Los colores de la factura en Mi marca: cuales son, como sale hoy, y el boton para cambiarlos. */
export function SeccionColores({
  nombreMarca,
  colorPrimario,
  colorSecundario,
  onCambiar,
}: SeccionColoresProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const sinColores = !colorPrimario && !colorSecundario;

  /*
   * Los que de verdad usa el PDF: sin elegir, los de la app; con uno solo, el
   * otro toma el mismo (la misma regla que el backend).
   */
  const principal = colorPrimario ?? (sinColores ? COLORES_DE_LA_APP.primario : colorSecundario);
  const acento = colorSecundario ?? (sinColores ? COLORES_DE_LA_APP.secundario : colorPrimario);

  return (
    <View style={styles.seccion}>
      <View style={styles.encabezado}>
        <Text variant="title" weight="bold" accessibilityRole="header">
          Colores
        </Text>
        <Button
          label="Cambiar"
          variant="ghost"
          size="sm"
          onPress={onCambiar}
          accessibilityLabel="Cambiar los colores de la factura"
        />
      </View>

      <View style={styles.muestras}>
        <MuestraColor etiqueta="Principal" color={principal} />
        <MuestraColor etiqueta="Acento" color={acento} />
      </View>

      <Text variant="caption" tone={sinColores ? 'warning' : 'muted'}>
        {sinColores
          ? 'Tu factura sale con los colores de la app. Elegí los de tu marca.'
          : 'Tiñen la factura que les mandás a tus clientes.'}
      </Text>
      <VistaPreviaColores
        nombreMarca={nombreMarca}
        primario={colorPrimario ?? null}
        secundario={colorSecundario ?? null}
      />
    </View>
  );
}

interface MuestraColorProps {
  etiqueta: string;
  color?: string;
}

/**
 * Un cuadradito con el color y su codigo. El color es un dato de la marca, no
 * del theme: por eso va en `style` en linea.
 */
function MuestraColor({ etiqueta, color }: MuestraColorProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View
      style={styles.muestra}
      accessible
      accessibilityLabel={`${etiqueta}: ${color ?? 'sin color'}`}
    >
      <View style={[styles.cuadrado, { backgroundColor: color }]} />
      <View>
        <Text variant="caption" weight="medium">
          {etiqueta}
        </Text>
        <Text variant="caption" tone="muted" selectable>
          {color ?? '—'}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    seccion: { gap: theme.spacing.sm },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    muestras: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg },
    muestra: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    // Con borde: un color muy claro no se pierde contra el fondo.
    cuadrado: {
      width: theme.spacing.lg,
      height: theme.spacing.lg,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });
