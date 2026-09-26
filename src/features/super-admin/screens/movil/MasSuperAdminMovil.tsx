import { useRouter } from 'expo-router';
import { LogOut, Megaphone, Server, Settings } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useSesion } from '@/features/auth/hooks';
import { OpcionMenu } from '@/features/cuenta/components';
import { Badge, Button, Modal, Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

/**
 * El tab "Más" del super_admin: los avisos (notificaciones a todos), el
 * estado del sistema, los ajustes de la app y cerrar sesion.
 *
 * Es un menu sin datos de la API (el usuario sale de la sesion ya cargada),
 * asi que no lleva el gesto de refrescar.
 */
export function MasSuperAdminMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { usuario, cerrarSesion } = useSesion();
  const [confirmando, setConfirmando] = useState(false);

  const confirmarCierre = useCallback(() => {
    setConfirmando(false);
    cerrarSesion();
  }, [cerrarSesion]);

  const tamanoIcono = theme.typography.size.body;

  return (
    <Pantalla titulo="Más" descripcion="Avisos, el sistema y los ajustes de la app.">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {usuario ? (
          <View style={styles.tarjetaUsuario}>
            <View style={styles.nombre}>
              <Text variant="title" weight="bold" style={styles.flexible}>
                {usuario.nombre}
              </Text>
              <Badge label="Super admin" tone="primary" />
            </View>
            <Text variant="caption" tone="muted">
              {usuario.email}
            </Text>
          </View>
        ) : null}

        <View style={styles.grupo}>
          <OpcionMenu
            icono={<Megaphone size={tamanoIcono} color={theme.colors.text} />}
            titulo="Avisos"
            descripcion="Mandar una notificación a todos los que tienen la app"
            onPress={() => router.push('/super-admin/mas/avisos')}
          />
          <OpcionMenu
            icono={<Server size={tamanoIcono} color={theme.colors.text} />}
            titulo="Sistema"
            descripcion="Server, base de datos, servicios y versiones en uso"
            onPress={() => router.push('/super-admin/mas/sistema')}
          />
          <OpcionMenu
            icono={<Settings size={tamanoIcono} color={theme.colors.text} />}
            titulo="Configuración"
            descripcion="Apariencia y tipografía"
            onPress={() => router.push('/super-admin/mas/configuracion')}
          />
        </View>

        <View style={styles.grupo}>
          <OpcionMenu
            icono={<LogOut size={tamanoIcono} color={theme.colors.error} />}
            titulo="Cerrar sesión"
            tono="error"
            navega={false}
            onPress={() => setConfirmando(true)}
          />
        </View>
      </ScrollView>

      <Modal
        visible={confirmando}
        onClose={() => setConfirmando(false)}
        titulo="Cerrar sesión"
        descripcion="Vas a tener que volver a entrar con tu email y contraseña."
        acciones={
          <>
            <Button label="Cancelar" variant="ghost" onPress={() => setConfirmando(false)} />
            <Button label="Cerrar sesión" variant="danger" onPress={confirmarCierre} />
          </>
        }
      />
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.lg, paddingBottom: theme.spacing.lg },
    tarjetaUsuario: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    nombre: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    flexible: { flexShrink: 1 },
    grupo: { gap: theme.spacing.sm },
  });
