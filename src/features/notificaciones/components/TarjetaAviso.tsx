import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Button, Text } from '@/shared/ui/atoms';
import { haceCuanto } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { PRESENTACION_TIPO } from '../tipos';
import type { TipoAviso } from '../types';

interface TarjetaAvisoProps {
  titulo: string;
  mensaje: string;
  tipo: TipoAviso;
  /** ISO. Sin fecha (la vista previa del panel) no se muestra. */
  fecha?: string;
  /** Solo en "version": el boton Actualizar. */
  urlTienda?: string | null;
  onActualizar?: (url: string) => void;
}

/**
 * Un aviso: tipo, titulo, el mensaje COMPLETO (en la notificacion Android
 * muestra solo dos lineas) y hace cuanto llego. Recibe todo por props: la usa
 * tambien la vista previa del panel del super_admin.
 */
function TarjetaAvisoComponent({
  titulo,
  mensaje,
  tipo,
  fecha,
  urlTienda,
  onActualizar,
}: TarjetaAvisoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { etiqueta, Icono, tono } = PRESENTACION_TIPO[tipo];
  const cuando = haceCuanto(fecha);

  return (
    <View style={styles.tarjeta}>
      <View style={styles.encabezado}>
        <Icono size={18} color={theme.colors.textMuted} />
        <Badge label={etiqueta} tone={tono} />
        {cuando ? (
          <Text variant="caption" tone="muted" style={styles.fecha}>
            {cuando}
          </Text>
        ) : null}
      </View>
      <Text variant="body" weight="bold">
        {titulo || 'Título del aviso'}
      </Text>
      <Text variant="body" tone={mensaje ? 'default' : 'muted'}>
        {mensaje || 'El mensaje va acá.'}
      </Text>
      {tipo === 'version' && urlTienda && onActualizar ? (
        <Button label="Actualizar" size="sm" onPress={() => onActualizar(urlTienda)} />
      ) : null}
    </View>
  );
}

export const TarjetaAviso = memo(TarjetaAvisoComponent);

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
    // Empuja la fecha a la derecha.
    fecha: { marginLeft: 'auto' },
  });
