import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface SeccionProps {
  titulo: string;
  /** Una linea de contexto debajo del titulo. */
  descripcion?: string;
  /** Algo al costado del titulo: un boton chico. */
  accion?: ReactNode;
  children: ReactNode;
}

/** Un bloque con titulo dentro de una pantalla del panel. */
export function Seccion({ titulo, descripcion, accion, children }: SeccionProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.seccion}>
      <View style={styles.encabezado}>
        <View style={styles.titulos}>
          <Text variant="title" weight="bold" accessibilityRole="header">
            {titulo}
          </Text>
          {descripcion ? (
            <Text variant="caption" tone="muted">
              {descripcion}
            </Text>
          ) : null}
        </View>
        {accion}
      </View>
      {children}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    seccion: { gap: theme.spacing.sm },
    encabezado: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    titulos: { flex: 1, gap: 2 },
  });
