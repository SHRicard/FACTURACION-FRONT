import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../Text';
import { CLAVES_PARES, useTheme, useTipografia, type Theme } from '@/theme';

/**
 * Selector de tipografia para que el cliente pruebe y elija.
 *
 * Cada opcion se renderiza CON su propia fuente, asi se compara de un vistazo
 * sin tener que aplicarla. Al elegir, cambia toda la app al instante y queda
 * guardada en el storage.
 */
export function SelectorTipografia() {
  const theme = useTheme();
  const { par, pares, setPar } = useTipografia();
  const styles = createStyles(theme);

  return (
    <View style={styles.lista}>
      {CLAVES_PARES.map((clave) => {
        const opcion = pares[clave];
        const activa = clave === par;

        return (
          <Pressable
            key={clave}
            onPress={() => setPar(clave)}
            style={[styles.opcion, activa && styles.opcionActiva]}
            accessibilityRole="radio"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={`Tipografia ${opcion.nombre}`}
          >
            <View style={styles.textos}>
              {/* Cada muestra se dibuja con SU fuente, no con la activa. */}
              <Text
                variant="title"
                weight="bold"
                style={opcion.family.display.bold}
                tone={activa ? 'primary' : 'default'}
              >
                {opcion.nombre}
              </Text>
              <Text variant="body" style={opcion.family.text.regular} tone="muted">
                Factura B 0001-00042 · $ 128.450,00
              </Text>
              <Text variant="caption" style={opcion.family.text.regular} tone="muted">
                {opcion.descripcion}
              </Text>
            </View>

            {/* Ademas del borde de color, un tilde: el estado no se comunica solo con color. */}
            <View style={styles.marca}>
              {activa ? <Check size={20} color={theme.colors.primary} /> : null}
            </View>
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      minHeight: 44,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    opcionActiva: { borderColor: theme.colors.primary, borderWidth: 2 },
    textos: { flex: 1, gap: theme.spacing.xs },
    marca: { width: 24, alignItems: 'center' },
  });
