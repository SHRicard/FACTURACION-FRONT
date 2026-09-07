import { Check, Moon, Smartphone, Sun } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../Text';
import { useTheme, useThemeMode, type Theme, type ThemeMode } from '@/theme';

interface Opcion {
  modo: ThemeMode;
  nombre: string;
  descripcion: string;
  Icono: ComponentType<{ size: number; color: string }>;
}

const OPCIONES: readonly Opcion[] = [
  {
    modo: 'system',
    nombre: 'Automatico',
    descripcion: 'Sigue el modo del celular',
    Icono: Smartphone,
  },
  { modo: 'light', nombre: 'Claro', descripcion: 'Siempre en claro', Icono: Sun },
  { modo: 'dark', nombre: 'Oscuro', descripcion: 'Siempre en oscuro', Icono: Moon },
];

/**
 * Elige el modo claro/oscuro. La preferencia queda guardada en el storage, asi
 * que sobrevive a cerrar la app.
 *
 * `Automatico` no es lo mismo que claro: quien lo elige quiere que la app
 * cambie sola cuando el celular cambia, por eso es una opcion aparte y no el
 * estado "ninguna de las dos".
 */
export function SelectorModo() {
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
  const styles = createStyles(theme);

  return (
    <View style={styles.lista} accessibilityRole="radiogroup">
      {OPCIONES.map(({ modo, nombre, descripcion, Icono }) => {
        const activa = modo === mode;

        return (
          <Pressable
            key={modo}
            onPress={() => setMode(modo)}
            style={[styles.opcion, activa && styles.opcionActiva]}
            accessibilityRole="radio"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={nombre}
            accessibilityHint={descripcion}
          >
            <Icono size={20} color={activa ? theme.colors.primary : theme.colors.textMuted} />
            <View style={styles.textos}>
              <Text variant="body" weight="medium" tone={activa ? 'primary' : 'default'}>
                {nombre}
              </Text>
              <Text variant="caption" tone="muted">
                {descripcion}
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
      backgroundColor: theme.colors.surface,
    },
    opcionActiva: { borderColor: theme.colors.primary, borderWidth: 2 },
    textos: { flex: 1, gap: theme.spacing.xs },
    marca: { width: 24, alignItems: 'center' },
  });
