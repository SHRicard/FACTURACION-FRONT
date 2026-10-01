import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ban, LogOut, Pencil, Trash2, UserCheck } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AvatarIniciales } from '@/features/marcas/components';
import { useRefrescar } from '@/shared/hooks';
import { Badge, BotonIcono, Button, EstadoVacio, Modal, Pantalla, Text } from '@/shared/ui/atoms';
import { conPuntos, formatearFecha, formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import {
  Dato,
  DialogoConTexto,
  DialogoEliminarUsuario,
  Seccion,
  TarjetaDatos,
} from '../../components';
import { estadoDeCuenta, formatearFechaHora, haceCuanto, TEXTO_PENDIENTE } from '../../formato';
import {
  LARGO_MAXIMO_MOTIVO,
  useAccionesUsuario,
  useEliminarUsuario,
  useUsuarioAdmin,
} from '../../hooks';

/**
 * La ficha de una cuenta: quien es, su marca, su actividad y en que paso del
 * onboarding quedo. Abajo, las acciones de soporte.
 *
 * Suspender, cerrar sesiones y eliminar no aplican a un super_admin: los
 * botones no aparecen (el backend igual responderia 403).
 */
export function UsuarioDetalleMovil() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const ficha = useUsuarioAdmin(id);
  const acciones = useAccionesUsuario(id);
  const baja = useEliminarUsuario(id);
  const refresco = useRefrescar(ficha.refrescar);

  const volver = () => router.back();

  if (ficha.cargando && !refresco.refrescando) {
    return (
      <Pantalla titulo="Cuenta" onVolver={volver} labelVolver="Usuarios">
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  if (!ficha.detalle) {
    return (
      <Pantalla titulo="Cuenta" onVolver={volver} labelVolver="Usuarios">
        <EstadoVacio
          titulo={ficha.noExiste ? 'Esta cuenta no existe' : 'No pudimos traer la cuenta'}
          descripcion={
            ficha.noExiste ? 'Puede que la hayan eliminado.' : (ficha.error ?? undefined)
          }
          accion={
            ficha.noExiste ? (
              <Button label="Volver" variant="secondary" onPress={volver} />
            ) : (
              <Button label="Reintentar" variant="secondary" onPress={ficha.reintentar} />
            )
          }
        />
      </Pantalla>
    );
  }

  const { usuario, marca, actividad, pendiente } = ficha.detalle;
  const estado = estadoDeCuenta({ ...usuario, pendiente });
  const esSuperAdmin = usuario.rol === 'super_admin';
  const iconoAccion = (Icono: typeof Ban, color: string) => <Icono size={16} color={color} />;

  return (
    <Pantalla
      titulo={usuario.nombre}
      descripcion={usuario.email}
      onVolver={volver}
      labelVolver="Usuarios"
      accion={
        <BotonIcono
          accessibilityLabel="Editar datos"
          onPress={() => router.push(`/super-admin/usuarios/${usuario.id}/editar`)}
        >
          <Pencil size={22} color={theme.colors.primary} strokeWidth={1.9} />
        </BotonIcono>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <View style={styles.cabecera}>
          <AvatarIniciales nombre={usuario.nombre} imagen={usuario.avatar ?? undefined} grande />
          <View style={styles.chips}>
            <Badge label={estado.etiqueta} tone={estado.tono} />
            <Badge label={usuario.proveedor === 'google' ? 'Google' : 'Email'} tone="neutral" />
          </View>
        </View>

        {acciones.aviso ? (
          <Text variant="body" tone="success" accessibilityRole="alert">
            {acciones.aviso}
          </Text>
        ) : null}

        {usuario.suspendida ? (
          <View style={styles.alerta}>
            <Text variant="body" weight="bold" tone="error">
              Suspendida {usuario.suspendidaEl ? `el ${formatearFecha(usuario.suspendidaEl)}` : ''}
            </Text>
            <Text variant="caption" tone="muted">
              {usuario.motivoSuspension
                ? `Motivo: ${usuario.motivoSuspension}`
                : 'Sin motivo escrito.'}
            </Text>
          </View>
        ) : null}

        {pendiente ? (
          <View style={styles.alerta}>
            <Text variant="body" weight="bold" tone="warning">
              Onboarding sin terminar
            </Text>
            <Text variant="caption" tone="muted">
              {TEXTO_PENDIENTE[pendiente]}.
            </Text>
          </View>
        ) : null}

        <Seccion titulo="Datos">
          <TarjetaDatos>
            <Dato etiqueta="DNI" valor={usuario.dni ? conPuntos(usuario.dni) : 'Sin cargar'} />
            <Dato etiqueta="Rol" valor={esSuperAdmin ? 'Super admin' : 'Administrador'} />
            <Dato etiqueta="Alta" valor={formatearFecha(usuario.createdAt) ?? '—'} />
            <Dato
              etiqueta="Términos"
              valor={
                usuario.aceptoTerminosYCondiciones
                  ? `Aceptó la versión ${usuario.terminosYCondicionesVersion ?? '—'}`
                  : 'No aceptó los vigentes'
              }
            />
          </TarjetaDatos>
        </Seccion>

        <Seccion titulo="Actividad">
          <TarjetaDatos>
            <Dato
              etiqueta="Último acceso"
              valor={
                actividad.ultimoAcceso
                  ? `${haceCuanto(actividad.ultimoAcceso)} · ${formatearFechaHora(actividad.ultimoAcceso)}`
                  : 'Nunca entró'
              }
            />
            <Dato
              etiqueta="Versión de la app"
              valor={actividad.ultimaVersionApp ?? 'Desconocida'}
              mono
            />
            <Dato
              etiqueta="Tickets que cargó"
              valor={`${actividad.ticketsRegistrados}${actividad.ultimoTicketEl ? ` · el último ${haceCuanto(actividad.ultimoTicketEl)}` : ''}`}
            />
            <Dato
              etiqueta="Pagos que registró"
              valor={`${actividad.pagosRegistrados}${actividad.ultimoPagoEl ? ` · el último ${haceCuanto(actividad.ultimoPagoEl)}` : ''}`}
            />
            <Dato
              etiqueta="Errores de la app (30 días)"
              valor={String(actividad.erroresApp30d)}
              tono={actividad.erroresApp30d > 0 ? 'warning' : 'default'}
            />
          </TarjetaDatos>
        </Seccion>

        <Seccion titulo="Marca">
          {marca ? (
            <TarjetaDatos>
              <Dato etiqueta="Nombre" valor={marca.nombre} />
              <Dato
                etiqueta="Dueños"
                valor={marca.duenos.map((dueno) => dueno.nombre).join(', ') || '—'}
              />
              <Dato etiqueta="Clientes" valor={String(marca.estadisticas.cantidadClientes)} />
              <Dato
                etiqueta="Vendido / deuda"
                valor={`${formatearMoneda(marca.estadisticas.totalVendido)} / ${formatearMoneda(marca.estadisticas.deudaPendiente)}`}
              />
              <Button
                label="Ver la marca"
                variant="ghost"
                onPress={() => router.push(`/super-admin/marcas/${marca.id}`, { withAnchor: true })}
                style={styles.enlace}
              />
            </TarjetaDatos>
          ) : (
            <Text variant="body" tone="muted">
              No tiene marca.
            </Text>
          )}
        </Seccion>

        {esSuperAdmin ? (
          <Text variant="caption" tone="muted">
            Es super admin: no se puede suspender, cerrarle las sesiones ni eliminar desde acá.
          </Text>
        ) : (
          <Seccion titulo="Soporte">
            {usuario.suspendida ? (
              <Button
                label="Reactivar cuenta"
                variant="secondary"
                onPress={() => acciones.abrir('reactivar')}
                leftIcon={iconoAccion(UserCheck, theme.colors.primary)}
                fullWidth
              />
            ) : (
              <Button
                label="Suspender cuenta"
                variant="secondary"
                onPress={() => acciones.abrir('suspender')}
                leftIcon={iconoAccion(Ban, theme.colors.primary)}
                fullWidth
              />
            )}
            <Button
              label="Cerrar todas sus sesiones"
              variant="secondary"
              onPress={() => acciones.abrir('cerrarSesiones')}
              leftIcon={iconoAccion(LogOut, theme.colors.primary)}
              fullWidth
            />
            <Button
              label="Eliminar cuenta"
              variant="danger"
              onPress={baja.abrir}
              leftIcon={iconoAccion(Trash2, theme.colors.onPrimary)}
              fullWidth
            />
          </Seccion>
        )}
      </ScrollView>

      <DialogoConTexto
        visible={acciones.dialogo === 'suspender'}
        titulo={`Suspender a ${usuario.nombre}`}
        descripcion="No va a poder entrar y su sesión abierta deja de valer al instante. No se borra nada."
        label="Motivo (opcional)"
        placeholder="Ej.: spam"
        helperText="Se lo mostramos a la persona cuando intente entrar."
        valor={acciones.motivo}
        onCambiar={acciones.setMotivo}
        maxLength={LARGO_MAXIMO_MOTIVO}
        confirmar="Suspender"
        variante="danger"
        cargando={acciones.ocupado}
        error={acciones.error}
        onConfirmar={acciones.confirmar}
        onCancelar={acciones.cerrar}
      />

      <Modal
        visible={acciones.dialogo === 'reactivar' || acciones.dialogo === 'cerrarSesiones'}
        onClose={acciones.cerrar}
        cerrarAlTocarFondo={!acciones.ocupado}
        titulo={
          acciones.dialogo === 'reactivar' ? 'Reactivar la cuenta' : 'Cerrar todas sus sesiones'
        }
        descripcion={
          acciones.dialogo === 'reactivar'
            ? 'Va a poder volver a entrar con su email o con Google.'
            : 'Tiene que volver a iniciar sesión en todos sus dispositivos. No le cambia la contraseña.'
        }
        acciones={
          <>
            <Button
              label="Cancelar"
              variant="ghost"
              onPress={acciones.cerrar}
              disabled={acciones.ocupado}
            />
            <Button
              label={acciones.dialogo === 'reactivar' ? 'Reactivar' : 'Cerrar sesiones'}
              onPress={acciones.confirmar}
              loading={acciones.ocupado}
            />
          </>
        }
      >
        {acciones.error ? (
          <Text variant="caption" tone="error">
            {acciones.error}
          </Text>
        ) : null}
      </Modal>

      <DialogoEliminarUsuario
        visible={baja.abierto}
        nombre={usuario.nombre}
        marca={baja.marca}
        confirmacion={baja.confirmacion}
        onEscribir={baja.setConfirmacion}
        eliminando={baja.eliminando}
        error={baja.error}
        onConfirmar={baja.confirmar}
        onCancelar={baja.cerrar}
      />
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.lg, paddingBottom: theme.spacing.xl },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cabecera: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    chips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
    alerta: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    enlace: { marginVertical: theme.spacing.xs },
  });
