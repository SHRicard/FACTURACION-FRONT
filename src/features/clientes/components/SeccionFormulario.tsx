import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface SeccionFormularioProps {
  icono: LucideIcon;
  titulo: string;
  /** Una linea que dice para que sirve el bloque. */
  descripcion?: string;
  /** Marca el bloque entero como opcional: ahorra un "(opcional)" por campo. */
  opcional?: boolean;
  children: ReactNode;
}

/**
 * Un bloque del formulario del cliente, con icono y titulo.
 *
 * Siete campos seguidos se leen como una planilla; agrupados en "quien es",
 * "como lo contacto" y "cuanto le fio" se entiende de un vistazo que es
 * obligatorio y que se puede dejar para despues.
 *
 * La tarjeta va en el fondo de la pantalla y los campos en `surface`: asi cada
 * campo se distingue de su bloque (gris sobre gris no se leia).
 */
export function SeccionFormulario({
  icono: Icono,
  titulo,
  descripcion,
  opcional = false,
  children,
}: SeccionFormularioProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.seccion}>
      <View style={styles.encabezado}>
        <View style={styles.icono}>
          <Icono size={18} color={theme.colors.primary} strokeWidth={2} />
        </View>
        <View style={styles.textos}>
          <View style={styles.fila}>
            <Text variant="body" weight="bold" accessibilityRole="header">
              {titulo}
            </Text>
            {opcional ? (
              <Text variant="caption" tone="muted">
                Opcional
              </Text>
            ) : null}
          </View>
          {descripcion ? (
            <Text variant="caption" tone="muted">
              {descripcion}
            </Text>
          ) : null}
        </View>
      </View>

      {children}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    seccion: {
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    encabezado: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    icono: {
      width: theme.spacing.xl + theme.spacing.xs,
      height: theme.spacing.xl + theme.spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
    },
    textos: { flex: 1, gap: 2 },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
  });
