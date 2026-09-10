import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { Proveedor, Rol } from '@/features/auth/types';
import { useRefrescar } from '@/shared/hooks';
import { formatearFecha } from '@/shared/utils';
import { EstadoVacio, Pantalla } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { FilaDato } from '../../components';
import { usePerfil } from '../../hooks';

/** Los valores del backend, en castellano y sin guiones bajos. */
const NOMBRE_ROL: Record<Rol, string> = {
  administrador: 'Administrador',
  super_admin: 'Super administrador',
};

const NOMBRE_PROVEEDOR: Record<Proveedor, string> = {
  local: 'Email y contrasena',
  google: 'Google',
};

/**
 * Los datos de la cuenta, en modo lectura.
 *
 * Todavia no se editan: el endpoint para actualizar el perfil no existe. Lo que
 * si funciona es tirar para abajo: vuelve a pedir `/auth/me`, asi que si te
 * cambiaron el nombre o el rol desde el panel, se ve aca sin cerrar sesion.
 */
export function PerfilMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { usuario, refrescar } = usePerfil();
  const refresco = useRefrescar(refrescar);

  const volver = () => router.back();

  if (!usuario) {
    // No deberia pasar: el guard de `/admin` no deja entrar sin sesion. Esta
    // por si acaso, para no reventar con un `usuario.nombre` sobre null.
    return (
      <Pantalla titulo="Mi perfil" onVolver={volver} labelVolver="Mas">
        <EstadoVacio titulo="No hay una sesion activa" />
      </Pantalla>
    );
  }

  const miembroDesde = formatearFecha(usuario.createdAt);

  return (
    <Pantalla titulo="Mi perfil" ancho="contenido" onVolver={volver} labelVolver="Mas">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <View style={styles.bloque}>
          <FilaDato etiqueta="Nombre" valor={usuario.nombre} />
          <FilaDato etiqueta="Email" valor={usuario.email} />
          <FilaDato etiqueta="Rol" valor={NOMBRE_ROL[usuario.rol]} />
          {usuario.proveedor ? (
            <FilaDato etiqueta="Inicia sesion con" valor={NOMBRE_PROVEEDOR[usuario.proveedor]} />
          ) : null}
          {miembroDesde ? <FilaDato etiqueta="Miembro desde" valor={miembroDesde} /> : null}
        </View>
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { paddingBottom: theme.spacing.lg },
    bloque: {
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  });
