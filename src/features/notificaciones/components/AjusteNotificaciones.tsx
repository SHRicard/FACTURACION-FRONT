import { Bell, BellOff } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { usePermisoNotificaciones } from '../hooks';

/**
 * El bloque "Notificaciones" de Configuracion: activadas o desactivadas, y
 * como activarlas. Si estan bloqueadas, el boton abre los ajustes del sistema.
 * En web o en un emulador no se dibuja nada (ni el titulo): ahi no llegan.
 */
export function AjusteNotificaciones() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { estado, activando, activar } = usePermisoNotificaciones();

  if (estado === null || estado === 'noDisponible') return null;

  const activadas = estado === 'activadas';
  const Icono = activadas ? Bell : BellOff;

  return (
    <View style={styles.bloque}>
      <View style={styles.encabezado}>
        <Text variant="title" weight="bold" accessibilityRole="header">
          Notificaciones
        </Text>
        <Text variant="caption" tone="muted">
          Los avisos de la app llegan a este teléfono.
        </Text>
      </View>
      <View style={styles.fila}>
        <Icono size={20} color={activadas ? theme.colors.success : theme.colors.textMuted} />
        <View style={styles.textos}>
          <Text variant="body" weight="medium">
            {activadas ? 'Activadas' : 'Desactivadas'}
          </Text>
          <Text variant="caption" tone="muted">
            {activadas
              ? 'Te avisamos de mantenimientos, novedades y versiones nuevas.'
              : estado === 'bloqueadas'
                ? 'Las apagaste en el teléfono: se activan desde sus ajustes.'
                : 'Activalas para enterarte de mantenimientos y novedades.'}
          </Text>
        </View>
        {activadas ? null : (
          <Button
            label={estado === 'bloqueadas' ? 'Ajustes' : 'Activar'}
            size="sm"
            variant="secondary"
            onPress={activar}
            loading={activando}
          />
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bloque: { gap: theme.spacing.md },
    encabezado: { gap: theme.spacing.xs },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    textos: { flex: 1, gap: 2 },
  });
