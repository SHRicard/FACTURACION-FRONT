import { ImagePlus, Trash2 } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { imagenAlTamano } from '../logo';

interface SeccionLogoProps {
  nombre: string;
  logoUrl?: string;
  /** El server tiene Cloudinary: se puede subir. Sin esto no hay botones. */
  puedeSubir: boolean;
  eligiendo: boolean;
  aviso: string | null;
  onElegir: () => void;
  onSacar: () => void;
}

/**
 * El logo de la marca, como sale en el PDF y el mail de la factura. Sigue la
 * tabla de MARCAS.md:
 *   puede subir, sin logo → "Subir logo"
 *   puede subir, con logo → el logo, "Cambiar logo" y "Sacar logo"
 *   no puede,    sin logo → nada: la seccion no se dibuja
 *   no puede,    con logo → el logo, sin botones
 */
export function SeccionLogo({
  nombre,
  logoUrl,
  puedeSubir,
  eligiendo,
  aviso,
  onElegir,
  onSacar,
}: SeccionLogoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  if (!puedeSubir && !logoUrl) return null;

  return (
    <View style={styles.seccion}>
      <Text variant="title" weight="bold" accessibilityRole="header">
        Logo
      </Text>
      <Text variant="caption" tone="muted">
        Así te ven tus clientes en la factura y en el mail.
      </Text>

      <View style={styles.fila}>
        {/* Cuadrado y "contain": un logo apaisado no se recorta. */}
        <View style={styles.marco}>
          {logoUrl ? (
            <Image
              // Del tamaño del recuadro y en WEBP, no el original de hasta 1000×1000.
              source={{ uri: imagenAlTamano(logoUrl, theme.spacing.xxl * 2) }}
              style={styles.imagen}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
              accessibilityLabel={`Logo de ${nombre}`}
            />
          ) : (
            <ImagePlus size={28} color={theme.colors.textMuted} strokeWidth={1.6} />
          )}
        </View>

        {puedeSubir ? (
          <View style={styles.acciones}>
            <Button
              label={logoUrl ? 'Cambiar logo' : 'Subir logo'}
              variant="secondary"
              size="sm"
              onPress={onElegir}
              loading={eligiendo}
            />
            {logoUrl ? (
              <Pressable
                onPress={onSacar}
                accessibilityRole="button"
                hitSlop={theme.spacing.xs}
                style={({ pressed }) => [styles.sacar, pressed && styles.presionado]}
              >
                <Trash2 size={14} color={theme.colors.error} />
                <Text variant="caption" weight="bold" tone="error">
                  Sacar logo
                </Text>
              </Pressable>
            ) : (
              <Text variant="caption" tone="warning">
                Lo vas a necesitar para generar las facturas. PNG, JPG o WEBP.
              </Text>
            )}
          </View>
        ) : null}
      </View>

      {aviso ? (
        <Text variant="caption" tone="warning" accessibilityLiveRegion="polite">
          {aviso}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    seccion: { gap: theme.spacing.sm },
    fila: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    marco: {
      width: theme.spacing.xxl * 2,
      height: theme.spacing.xxl * 2,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xs,
      overflow: 'hidden',
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    imagen: { width: '100%', height: '100%' },
    acciones: { flex: 1, alignItems: 'flex-start', gap: theme.spacing.sm },
    sacar: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, minHeight: 32 },
    presionado: { opacity: 0.5 },
  });
