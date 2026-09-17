import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, EstadoVacio, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface EstadoMetricaProps {
  /** Primera carga, sin nada que mostrar todavia. Apagado durante el gesto de refrescar. */
  cargando: boolean;
  error: string | null;
  /** Si ya hay datos, un error de refresco no tapa la pantalla: va como aviso arriba. */
  hayDatos: boolean;
  onReintentar: () => void;
  /** "No pudimos traer la tasa de cobranza". */
  tituloError: string;
  icono: ReactNode;
  children: ReactNode;
}

/**
 * La carga, el error y el contenido de una metrica que se dibuja en un
 * ScrollView. Va ADENTRO del scroll: asi el cartel de error tambien se puede
 * tirar para abajo, que es lo primero que se prueba cuando algo falla.
 */
export function EstadoMetrica({
  cargando,
  error,
  hayDatos,
  onReintentar,
  tituloError,
  icono,
  children,
}: EstadoMetricaProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!hayDatos) {
    return (
      <EstadoVacio
        icono={icono}
        titulo={tituloError}
        descripcion={error ?? 'Probá de nuevo en un rato.'}
        accion={<Button label="Reintentar" variant="secondary" onPress={onReintentar} />}
      />
    );
  }

  return (
    <>
      {error ? (
        <Text variant="caption" tone="error">
          {error}
        </Text>
      ) : null}
      {children}
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    centro: { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl },
  });
