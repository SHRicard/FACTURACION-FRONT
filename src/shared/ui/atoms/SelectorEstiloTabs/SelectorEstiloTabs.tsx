import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { CLAVES_ESTILOS_TABS, useEstiloTabs, useTheme, type Theme } from '@/theme';

import { Text } from '../Text';
import { MuestraBarra } from './MuestraBarra';

/**
 * Selector de estilo de la barra de tabs, para que el cliente elija el que mas
 * le guste.
 *
 * Cada opcion se dibuja a escala, asi se compara de un vistazo. Al elegir, la
 * barra de abajo cambia al instante y la eleccion queda en el storage.
 */
export function SelectorEstiloTabs() {
  const theme = useTheme();
  const { clave, estilos, setEstilo } = useEstiloTabs();
  const styles = createStyles(theme);

  return (
    <View style={styles.lista}>
      {CLAVES_ESTILOS_TABS.map((claveEstilo) => {
        const estilo = estilos[claveEstilo];
        const activa = claveEstilo === clave;

        return (
          <Pressable
            key={claveEstilo}
            onPress={() => setEstilo(claveEstilo)}
            style={[styles.opcion, activa && styles.opcionActiva]}
            accessibilityRole="radio"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={`Barra ${estilo.nombre}. ${estilo.descripcion}`}
          >
            <View style={styles.encabezado}>
              <View style={styles.textos}>
                <Text variant="body" weight="bold" tone={activa ? 'primary' : 'default'}>
                  {estilo.nombre}
                </Text>
                <Text variant="caption" tone="muted">
                  {estilo.descripcion}
                </Text>
              </View>
              {/* Ademas del borde de color, un tilde: el estado no se comunica solo con color. */}
              <View style={styles.marca}>
                {activa ? <Check size={20} color={theme.colors.primary} /> : null}
              </View>
            </View>

            <MuestraBarra estilo={estilo} />
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    lista: { gap: theme.spacing.sm },
    opcion: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    opcionActiva: { borderColor: theme.colors.primary, borderWidth: 2 },
    encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
    textos: { flex: 1, gap: theme.spacing.xs },
    marca: { width: 24, alignItems: 'center' },
  });
