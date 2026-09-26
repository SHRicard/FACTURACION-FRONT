import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calculator, Pencil, UserPlus } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AvatarIniciales } from '@/features/marcas/components';
import { useRefrescar } from '@/shared/hooks';
import { Badge, BotonIcono, Button, EstadoVacio, Modal, Pantalla, Text } from '@/shared/ui/atoms';
import { formatearFecha, formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { Dato, DialogoConTexto, FilaDuenoAdmin, Seccion, TarjetaDatos } from '../../components';
import { haceCuanto } from '../../formato';
import { useMarcaAdmin } from '../../hooks';

/**
 * La ficha de una marca vista desde el panel: sus numeros, cuanto se usa, sus
 * duenos y las acciones de soporte (editar, sumar o sacar duenos, recalcular).
 *
 * El logo no se toca desde aca: lo sube el dueno.
 */
export function MarcaDetalleMovil() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const ficha = useMarcaAdmin(id);
  const refresco = useRefrescar(ficha.refrescar);

  const volver = () => router.back();
  const irAUsuario = (usuarioId: string) =>
    router.push(`/super-admin/usuarios/${usuarioId}`, { withAnchor: true });

  if (ficha.cargando && !refresco.refrescando) {
    return (
      <Pantalla titulo="Marca" ancho="contenido" onVolver={volver} labelVolver="Marcas">
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  if (!ficha.detalle) {
    return (
      <Pantalla titulo="Marca" ancho="contenido" onVolver={volver} labelVolver="Marcas">
        <EstadoVacio
          titulo={ficha.noExiste ? 'Esta marca no existe' : 'No pudimos traer la marca'}
          descripcion={ficha.noExiste ? 'Puede que la hayan borrado.' : (ficha.error ?? undefined)}
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

  const { marca, uso } = ficha.detalle;
  const { estadisticas } = marca;
  const creadaPor = typeof marca.creadaPor === 'object' ? marca.creadaPor : null;
  // La marca nunca queda sin duenos: con uno solo, no se ofrece sacarlo.
  const puedeSacar = marca.duenos.length > 1;

  return (
    <Pantalla
      titulo={marca.nombre}
      descripcion={marca.direccion ?? undefined}
      ancho="contenido"
      onVolver={volver}
      labelVolver="Marcas"
      accion={
        <BotonIcono
          accessibilityLabel="Editar marca"
          onPress={() => router.push(`/super-admin/marcas/${marca.id}/editar`)}
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
          <AvatarIniciales nombre={marca.nombre} imagen={marca.logoUrl ?? undefined} grande />
          <View style={styles.textos}>
            <View style={styles.chips}>
              <Badge
                label={uso.activa ? 'Activa' : 'Dormida'}
                tone={uso.activa ? 'success' : 'neutral'}
              />
            </View>
            <Text variant="caption" tone="muted">
              {uso.ultimaActividad
                ? `Última actividad ${haceCuanto(uso.ultimaActividad)}`
                : 'Nunca se usó'}
            </Text>
          </View>
        </View>

        {ficha.aviso ? (
          <Text variant="body" tone="success" accessibilityRole="alert">
            {ficha.aviso}
          </Text>
        ) : null}

        <Seccion
          titulo="Estadísticas"
          descripcion={
            estadisticas.actualizadasEl
              ? `Calculadas ${haceCuanto(estadisticas.actualizadasEl)}`
              : undefined
          }
          accion={
            <Button
              label="Recalcular"
              variant="ghost"
              size="sm"
              onPress={ficha.recalcular}
              loading={ficha.recalculando}
              leftIcon={<Calculator size={16} color={theme.colors.primary} />}
            />
          }
        >
          <TarjetaDatos>
            <Dato etiqueta="Vendido" valor={formatearMoneda(estadisticas.totalVendido)} />
            <Dato etiqueta="Cobrado" valor={formatearMoneda(estadisticas.totalCobrado)} />
            <Dato
              etiqueta="Deuda pendiente"
              valor={formatearMoneda(estadisticas.deudaPendiente)}
              tono={estadisticas.deudaPendiente > 0 ? 'warning' : 'default'}
            />
          </TarjetaDatos>
        </Seccion>

        <Seccion titulo="Uso">
          <TarjetaDatos>
            <Dato etiqueta="Clientes" valor={String(uso.clientes)} />
            <Dato etiqueta="Especies" valor={String(uso.especies)} />
            <Dato
              etiqueta="Facturas"
              valor={`${uso.facturas.abierta} abiertas (${uso.facturas.vencidas} vencidas) · ${uso.facturas.pagada} pagadas · ${uso.facturas.anulada} anuladas`}
            />
            <Dato
              etiqueta="Tickets"
              valor={`${uso.tickets.total} · ${uso.tickets.ultimos30d} en 30 días · ${uso.tickets.anulados} anulados`}
            />
            <Dato
              etiqueta="Pagos"
              valor={`${uso.pagos.total} · ${uso.pagos.ultimos30d} en 30 días · ${uso.pagos.anulados} anulados`}
            />
          </TarjetaDatos>
        </Seccion>

        <Seccion
          titulo="Dueños"
          accion={
            <Button
              label="Sumar"
              variant="ghost"
              size="sm"
              onPress={ficha.sumar.pedir}
              leftIcon={<UserPlus size={16} color={theme.colors.primary} />}
            />
          }
        >
          <View style={styles.tarjeta}>
            {marca.duenos.map((dueno) => (
              <FilaDuenoAdmin
                key={dueno.id}
                dueno={dueno}
                onAbrir={irAUsuario}
                onSacar={puedeSacar ? ficha.sacar.pedir : undefined}
              />
            ))}
          </View>
          {puedeSacar ? null : (
            <Text variant="caption" tone="muted">
              Una marca nunca queda sin dueños: para sacar a este, sumá otro primero.
            </Text>
          )}
        </Seccion>

        <Seccion titulo="Datos">
          <TarjetaDatos>
            <Dato etiqueta="Teléfono" valor={marca.telefono || 'Sin cargar'} />
            <Dato etiqueta="Dirección" valor={marca.direccion || 'Sin cargar'} />
            <Dato
              etiqueta="Colores"
              valor={
                [marca.colorPrimario, marca.colorSecundario].filter(Boolean).join(' · ') ||
                'Los de la app'
              }
              mono
            />
            <Dato
              etiqueta="Creada"
              valor={`${formatearFecha(marca.createdAt) ?? '—'}${creadaPor ? ` por ${creadaPor.nombre}` : ''}`}
            />
          </TarjetaDatos>
        </Seccion>
      </ScrollView>

      <DialogoConTexto
        visible={ficha.sumar.abierto}
        titulo="Sumar un dueño"
        descripcion="Tiene que ser una cuenta de administrador que todavía no tenga marca."
        label="DNI"
        placeholder="30111444"
        valor={ficha.sumar.dni}
        onCambiar={ficha.sumar.setDni}
        keyboardType="number-pad"
        maxLength={10}
        confirmar="Sumar"
        puedeConfirmar={ficha.sumar.dni.trim() !== ''}
        cargando={ficha.sumar.enviando}
        error={ficha.sumar.error}
        onConfirmar={ficha.sumar.confirmar}
        onCancelar={ficha.sumar.cancelar}
      />

      <Modal
        visible={ficha.sacar.dueno !== null}
        onClose={ficha.sacar.cancelar}
        cerrarAlTocarFondo={!ficha.sacar.enviando}
        titulo={`Sacar a ${ficha.sacar.dueno?.nombre ?? ''}`}
        descripcion="Deja de ser dueño de esta marca. Su cuenta sigue existiendo, sin marca."
        acciones={
          <>
            <Button
              label="Cancelar"
              variant="ghost"
              onPress={ficha.sacar.cancelar}
              disabled={ficha.sacar.enviando}
            />
            <Button
              label="Sacar"
              variant="danger"
              onPress={ficha.sacar.confirmar}
              loading={ficha.sacar.enviando}
            />
          </>
        }
      >
        {ficha.sacar.error ? (
          <Text variant="caption" tone="error">
            {ficha.sacar.error}
          </Text>
        ) : null}
      </Modal>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.lg, paddingBottom: theme.spacing.xl },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cabecera: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    textos: { flex: 1, gap: theme.spacing.xs },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
    tarjeta: {
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  });
