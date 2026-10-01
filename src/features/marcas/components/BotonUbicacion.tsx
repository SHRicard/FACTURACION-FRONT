import { LocateFixed } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import type { AvisoUbicacion } from '../hooks/useUbicacionComercio';

interface BotonUbicacionProps {
  onPress: () => void;
  buscando: boolean;
  aviso: AvisoUbicacion | null;
  onAbrirAjustes: () => void;
}

/**
 * "Usar mi ubicacion", debajo del campo de direccion. Es un atajo, no el
 * camino principal: por eso va como link con icono y no como un boton grande
 * que compita con "Crear mi marca".
 */
export function BotonUbicacion({ onPress, buscando, aviso, onAbrirAjustes }: BotonUbicacionProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.bloque}>
      <Pressable
        onPress={onPress}
        disabled={buscando}
        hitSlop={theme.spacing.xs}
        accessibilityRole="button"
        accessibilityLabel="Usar mi ubicación para completar la dirección"
        accessibilityState={{ busy: buscando }}
        style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
      >
        {buscando ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <LocateFixed size={16} color={theme.colors.primary} strokeWidth={2.2} />
        )}
        <Text variant="caption" weight="bold" tone="primary">
          {buscando ? 'Buscando dónde estás…' : 'Usar mi ubicación'}
        </Text>
      </Pressable>

      {aviso ? (
        <View style={styles.aviso} accessibilityLiveRegion="polite">
          <Text variant="caption" tone={aviso.tono}>
            {aviso.texto}
          </Text>
          {aviso.ofreceAjustes ? (
            <Pressable onPress={onAbrirAjustes} accessibilityRole="link" hitSlop={theme.spacing.xs}>
              <Text variant="caption" weight="bold" tone="primary">
                Abrir ajustes
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // Pegado al campo de arriba: el gap del formulario lo separaria de su dato.
    bloque: { gap: theme.spacing.xs, marginTop: -theme.spacing.sm },
    boton: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      minHeight: 32,
    },
    presionado: { opacity: 0.5 },
    aviso: { gap: 2 },
  });
