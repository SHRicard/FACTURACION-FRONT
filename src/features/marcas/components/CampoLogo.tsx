import { ImagePlus } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import type { FaseLogo } from '../hooks/useSubirLogo';

import { BarraProgreso } from './BarraProgreso';

interface CampoLogoProps {
  /** La imagen elegida (todavia sin subir), o null. */
  uri: string | null;
  eligiendo: boolean;
  /** Lo que paso al elegir (formato, build viejo). */
  aviso: string | null;
  fase: FaseLogo;
  progreso: number;
  onElegir: () => void;
  onQuitar: () => void;
}

/**
 * El logo en el alta de la marca, como un campo mas del formulario: se elige
 * aca y se sube recien al crear la marca (antes no hay a donde subirlo).
 *
 * Es opcional, pero el texto de ayuda dice para que hace falta: sin logo no se
 * generan las facturas.
 */
export function CampoLogo({
  uri,
  eligiendo,
  aviso,
  fase,
  progreso,
  onElegir,
  onQuitar,
}: CampoLogoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const subiendo = fase !== 'quieto';

  return (
    <View style={styles.campo}>
      <Text variant="caption" weight="medium" tone="muted">
        Logo
      </Text>

      <View style={styles.fila}>
        <Pressable
          onPress={onElegir}
          disabled={eligiendo || subiendo}
          accessibilityRole="button"
          accessibilityLabel={uri ? 'Cambiar el logo elegido' : 'Elegir el logo de tu negocio'}
          style={({ pressed }) => [
            styles.marco,
            !uri && styles.marcoVacio,
            pressed && styles.presionado,
          ]}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={styles.imagen}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <ImagePlus size={24} color={theme.colors.textMuted} strokeWidth={1.6} />
          )}
        </Pressable>

        <View style={styles.acciones}>
          <Button
            label={uri ? 'Cambiar' : 'Elegir logo'}
            variant="secondary"
            size="sm"
            onPress={onElegir}
            loading={eligiendo}
            disabled={subiendo}
          />
          {uri && !subiendo ? (
            <Pressable onPress={onQuitar} accessibilityRole="button" hitSlop={theme.spacing.xs}>
              <Text variant="caption" weight="bold" tone="muted">
                Quitar
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {subiendo ? <BarraProgreso fase={fase} progreso={progreso} /> : null}

      {aviso ? (
        <Text variant="caption" tone="warning" accessibilityLiveRegion="polite">
          {aviso}
        </Text>
      ) : (
        <Text variant="caption" tone="muted">
          {uri
            ? 'Se guarda al crear la marca. PNG, JPG o WEBP.'
            : 'Lo vas a necesitar para generar las facturas. Si ahora no lo tenés, lo subís después.'}
        </Text>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    campo: { gap: theme.spacing.xs },
    fila: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    marco: {
      width: theme.spacing.xxl + theme.spacing.md,
      height: theme.spacing.xxl + theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xs,
      overflow: 'hidden',
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    marcoVacio: { borderStyle: 'dashed' },
    imagen: { width: '100%', height: '100%' },
    acciones: { flex: 1, alignItems: 'flex-start', gap: theme.spacing.sm },
    presionado: { opacity: 0.6 },
  });
