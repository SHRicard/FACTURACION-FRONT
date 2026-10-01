import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { memo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { formatearFechaHora, TEXTO_PLATAFORMA } from '../formato';
import type { OcurrenciaError } from '../types';

interface TarjetaOcurrenciaProps {
  ocurrencia: OcurrenciaError;
}

/** Un texto largo en monoespaciado, que se scrollea de costado en vez de partirse. */
function Bloque({ titulo, texto }: { titulo: string; texto: string }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.bloque}>
      <Text variant="caption" tone="muted">
        {titulo}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.pre}>
        <Text variant="caption" selectable style={styles.mono}>
          {texto}
        </Text>
      </ScrollView>
    </View>
  );
}

/**
 * Una vez que paso el error: donde, en que telefono y a quien. El stack va
 * plegado: en un grupo de 20 ocurrencias, desplegados todos no se lee nada.
 */
function TarjetaOcurrenciaComponent({ ocurrencia }: TarjetaOcurrenciaProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [abierta, setAbierta] = useState(false);

  const telefono = [
    TEXTO_PLATAFORMA[ocurrencia.plataforma],
    ocurrencia.versionSO,
    ocurrencia.dispositivo,
  ]
    .filter(Boolean)
    .join(' · ');
  const quien = ocurrencia.usuario
    ? `${ocurrencia.usuario.nombre} (${ocurrencia.usuario.email})`
    : 'Sin sesión';
  const tieneDetalle = Boolean(ocurrencia.stack || ocurrencia.componentStack);
  const IconoFlecha = abierta ? ChevronUp : ChevronDown;

  return (
    <View style={styles.tarjeta}>
      <Pressable
        onPress={() => setAbierta((valor) => !valor)}
        disabled={!tieneDetalle}
        style={({ pressed }) => [styles.encabezado, pressed && styles.presionada]}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta, disabled: !tieneDetalle }}
        accessibilityHint={tieneDetalle ? 'Muestra el stack' : undefined}
      >
        <View style={styles.datos}>
          <View style={styles.chips}>
            {ocurrencia.fatal ? <Badge label="FATAL" tone="error" /> : null}
            {ocurrencia.version ? <Badge label={`v${ocurrencia.version}`} tone="neutral" /> : null}
          </View>
          <Text variant="caption" weight="medium">
            {formatearFechaHora(ocurrencia.ocurridoEn ?? ocurrencia.createdAt) ?? '—'}
          </Text>
          <Text variant="caption" tone="muted">
            {telefono}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {quien}
            {ocurrencia.marca ? ` · ${ocurrencia.marca.nombre}` : ''}
          </Text>
          {ocurrencia.ruta ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              en {ocurrencia.ruta}
            </Text>
          ) : null}
        </View>
        {tieneDetalle ? <IconoFlecha size={18} color={theme.colors.textMuted} /> : null}
      </Pressable>

      {abierta ? (
        <>
          {ocurrencia.stack ? <Bloque titulo="Stack" texto={ocurrencia.stack} /> : null}
          {ocurrencia.componentStack ? (
            <Bloque titulo="Árbol de React" texto={ocurrencia.componentStack} />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

export const TarjetaOcurrencia = memo(TarjetaOcurrenciaComponent);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    tarjeta: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    encabezado: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    presionada: { opacity: 0.7 },
    datos: { flex: 1, gap: 2 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
    bloque: { gap: theme.spacing.xs },
    pre: {
      padding: theme.spacing.sm,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    mono: { fontFamily: theme.typography.mono },
  });
