import { useRouter } from 'expo-router';
import { FileText, ShieldCheck, Trash2, UserMinus } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { Proveedor, Rol } from '@/features/auth/types';
import { RUTA_POR_DOCUMENTO } from '@/features/legal/rutas';
import { useRefrescar } from '@/shared/hooks';
import { conPuntos, formatearFecha } from '@/shared/utils';
import { EstadoVacio, Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { DialogoEliminarCuenta, FilaDato, OpcionMenu } from '../../components';
import { useEliminarCuenta, usePerfil } from '../../hooks';

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
 * Los datos de la cuenta, en modo lectura, mas lo legal.
 *
 * Los datos todavia no se editan: el endpoint para actualizar el perfil no
 * existe. Lo que si funciona es tirar para abajo: vuelve a pedir `/auth/me`,
 * asi que si te cambiaron el nombre o el rol desde el panel, se ve aca sin
 * cerrar sesion.
 *
 * Abajo van dos cosas que Google exige para publicar en Play y que tienen que
 * estar ACA, adentro de la app, no solo en el registro: los documentos legales
 * y la baja de la cuenta.
 */
export function PerfilMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { usuario, refrescar } = usePerfil();
  const refresco = useRefrescar(refrescar);
  const baja = useEliminarCuenta();

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
  const aceptadosEl = formatearFecha(usuario.terminosYCondicionesAceptadosEn);
  const tamanoIcono = theme.typography.size.body;

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
          {/* Con esto un socio te suma a su marca. No se cambia desde la app. */}
          {usuario.dni ? <FilaDato etiqueta="DNI" valor={conPuntos(usuario.dni)} /> : null}
          <FilaDato etiqueta="Rol" valor={NOMBRE_ROL[usuario.rol]} />
          {usuario.proveedor ? (
            <FilaDato etiqueta="Inicia sesion con" valor={NOMBRE_PROVEEDOR[usuario.proveedor]} />
          ) : null}
          {miembroDesde ? <FilaDato etiqueta="Miembro desde" valor={miembroDesde} /> : null}
        </View>

        <View style={styles.grupo}>
          <View style={styles.encabezado}>
            <Text variant="title" weight="bold" accessibilityRole="header">
              Legal
            </Text>
            {/*
              Que version acepto y cuando. No es un adorno: cuando el texto
              cambia de version, la app vuelve a pedir la aceptacion, y aca se
              ve cual fue la ultima que aceptaste.
            */}
            <Text variant="caption" tone="muted">
              {usuario.terminosYCondicionesVersion
                ? `Aceptaste la versión ${usuario.terminosYCondicionesVersion}${
                    aceptadosEl ? ` el ${aceptadosEl}` : ''
                  }.`
                : 'Los documentos que rigen el uso de la app.'}
            </Text>
          </View>

          <OpcionMenu
            icono={<FileText size={tamanoIcono} color={theme.colors.text} />}
            titulo="Términos y condiciones"
            onPress={() => router.push(RUTA_POR_DOCUMENTO.terminos)}
          />
          <OpcionMenu
            icono={<ShieldCheck size={tamanoIcono} color={theme.colors.text} />}
            titulo="Política de privacidad"
            descripcion="Qué datos guardamos y para qué"
            onPress={() => router.push(RUTA_POR_DOCUMENTO.privacidad)}
          />
          <OpcionMenu
            icono={<UserMinus size={tamanoIcono} color={theme.colors.text} />}
            titulo="Cómo eliminar tu cuenta"
            descripcion="También se puede pedir desde la web, sin entrar"
            onPress={() => router.push(RUTA_POR_DOCUMENTO['eliminar-cuenta'])}
          />
        </View>

        {/* Ultimo de todo y en rojo: es lo unico de la app que no se deshace. */}
        <View style={styles.grupo}>
          <OpcionMenu
            icono={<Trash2 size={tamanoIcono} color={theme.colors.error} />}
            titulo="Eliminar mi cuenta"
            descripcion="Se borra tu cuenta y, si sos la única dueña, todo el negocio"
            tono="error"
            navega={false}
            onPress={baja.abrir}
          />
        </View>
      </ScrollView>

      <DialogoEliminarCuenta
        visible={baja.abierto}
        caso={baja.caso}
        cargandoCaso={baja.cargandoCaso}
        confirmacion={baja.confirmacion}
        onEscribir={baja.escribir}
        puedeEliminar={baja.puedeEliminar}
        onConfirmar={baja.confirmar}
        onCancelar={baja.cerrar}
        eliminando={baja.eliminando}
        error={baja.error}
      />
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.lg, paddingBottom: theme.spacing.lg },
    bloque: {
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    grupo: { gap: theme.spacing.sm },
    encabezado: { gap: theme.spacing.xs },
  });
