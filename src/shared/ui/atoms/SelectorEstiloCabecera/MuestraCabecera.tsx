import { ChevronLeft, Pencil } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme, type EstiloCabecera, type Theme } from '@/theme';

import { Text } from '../Text';

/**
 * Miniatura de un estilo de cabecera, a escala.
 *
 * Existe para que el cliente vea lo que esta eligiendo sin tener que aplicarlo
 * y entrar a una ficha: es la misma idea que el selector de tipografia, donde
 * cada opcion se dibuja con su propia fuente.
 *
 * No es la cabecera de verdad: es un dibujo con los tokens del theme.
 */
export function MuestraCabecera({ estilo }: { estilo: EstiloCabecera }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.marco}>
      <View style={styles.barra}>
        <ChevronLeft size={18} color={theme.colors.primary} strokeWidth={2.2} />
        {estilo.conDestino ? (
          <Text variant="caption" tone="primary">
            Clientes
          </Text>
        ) : null}

        {estilo.tituloEnBarra ? (
          <View style={styles.centro}>
            <Text variant="caption" weight="bold" numberOfLines={1}>
              Marcela Ferreyra
            </Text>
          </View>
        ) : (
          <View style={styles.separador} />
        )}

        <Pencil size={15} color={theme.colors.primary} strokeWidth={1.9} />
      </View>

      {/* Sin titulo en la barra, abajo va el titulo grande. */}
      {estilo.tituloEnBarra ? null : (
        <Text variant="title" weight="bold" numberOfLines={1}>
          Marcela Ferreyra
        </Text>
      )}

      {/* La ficha, insinuada: lo que se compara es cuanto espacio le queda. */}
      <View style={styles.ficha} />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    marco: {
      gap: theme.spacing.xs,
      padding: theme.spacing.sm,
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
    },
    barra: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 28 },
    centro: { flex: 1, alignItems: 'center', paddingHorizontal: theme.spacing.xs },
    separador: { flex: 1 },
    ficha: {
      height: 34,
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  });
