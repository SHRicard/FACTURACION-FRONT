import { useLocalSearchParams, useRouter } from 'expo-router';
import { RotateCcw, Trash2 } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { BarraProporcion } from '@/features/metricas/components';
import { TarjetaAviso } from '@/features/notificaciones/components';
import { useRefrescar } from '@/shared/hooks';
import { Badge, BotonIcono, Button, EstadoVacio, Modal, Pantalla, Text } from '@/shared/ui/atoms';
import { contar } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { avanceDelEnvio, CHIP_ESTADO_AVISO, Dato, Seccion, TarjetaDatos } from '../../components';
import { formatearFechaHora, problemaDeCredenciales } from '../../formato';
import { useAvisoAdmin } from '../../hooks';

/**
 * Un aviso y como va su envio. Mientras se manda, el avance se actualiza solo;
 * las confirmaciones de Google/Apple llegan 15-20 minutos despues (tirar para
 * abajo las trae).
 */
export function AvisoDetalleMovil() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const detalle = useAvisoAdmin(id);
  const refresco = useRefrescar(detalle.refrescar);
  const { borrar } = detalle;

  const volver = () => router.back();

  if (detalle.cargando && !refresco.refrescando) {
    return (
      <Pantalla titulo="Aviso" ancho="contenido" onVolver={volver} labelVolver="Avisos">
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  const { aviso } = detalle;

  if (!aviso) {
    return (
      <Pantalla titulo="Aviso" ancho="contenido" onVolver={volver} labelVolver="Avisos">
        <EstadoVacio
          titulo={detalle.noExiste ? 'Este aviso no existe' : 'No pudimos traer el aviso'}
          descripcion={
            detalle.noExiste ? 'Puede que lo hayan borrado.' : (detalle.error ?? undefined)
          }
          accion={
            detalle.noExiste ? (
              <Button label="Volver" variant="secondary" onPress={volver} />
            ) : (
              <Button label="Reintentar" variant="secondary" onPress={detalle.reintentar} />
            )
          }
        />
      </Pantalla>
    );
  }

  const { envio } = aviso;
  const chip = CHIP_ESTADO_AVISO[aviso.estado];
  const credenciales = problemaDeCredenciales(envio.errores);
  const errores = Object.entries(envio.errores);
  const creadoPor = typeof aviso.creadoPor === 'object' ? aviso.creadoPor : null;

  return (
    <Pantalla
      titulo="Aviso"
      descripcion={formatearFechaHora(aviso.createdAt) ?? undefined}
      ancho="contenido"
      onVolver={volver}
      labelVolver="Avisos"
      accion={
        aviso.estado === 'enviando' ? undefined : (
          <BotonIcono accessibilityLabel="Borrar aviso" onPress={borrar.pedir}>
            <Trash2 size={22} color={theme.colors.error} strokeWidth={1.9} />
          </BotonIcono>
        )
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <TarjetaAviso titulo={aviso.titulo} mensaje={aviso.mensaje} tipo={aviso.tipo} />

        {credenciales ? (
          <Text variant="body" weight="bold" tone="error" accessibilityRole="alert">
            {credenciales}
          </Text>
        ) : null}
        {detalle.errorAccion ? (
          <Text variant="body" tone="error" accessibilityRole="alert">
            {detalle.errorAccion}
          </Text>
        ) : null}

        <Seccion titulo="Envío">
          <View style={styles.chips}>
            <Badge label={chip.etiqueta} tone={chip.tono} />
          </View>
          {aviso.estado === 'enviando' ? (
            <BarraProporcion
              etiqueta="Avance"
              valor={`${envio.enviados + envio.rechazados} de ${envio.dispositivos}`}
              proporcion={avanceDelEnvio(aviso)}
              tono="primary"
            />
          ) : null}
          {aviso.estado === 'fallido' ? (
            <>
              <Text variant="caption" tone="muted">
                {envio.ultimoError ?? 'Expo no respondió después de varios intentos.'} Reintentar
                sigue desde donde quedó: a quien ya le llegó no se le manda de nuevo.
              </Text>
              <Button
                label="Reintentar"
                onPress={detalle.reintentarEnvio}
                loading={detalle.reintentando}
                leftIcon={<RotateCcw size={16} color={theme.colors.onPrimary} />}
                fullWidth
              />
            </>
          ) : null}
          <TarjetaDatos>
            <Dato etiqueta="Teléfonos" valor={String(envio.dispositivos)} />
            <Dato
              etiqueta="Aceptados por Expo"
              valor={`${envio.enviados} · rechazados ${envio.rechazados}`}
            />
            <Dato
              etiqueta="Entregados"
              valor={`${envio.entregados} · no entregados ${envio.fallidos}`}
              tono={envio.fallidos > 0 ? 'warning' : 'default'}
            />
            {aviso.enviadoEl ? (
              <Dato etiqueta="Terminó" valor={formatearFechaHora(aviso.enviadoEl) ?? '—'} />
            ) : null}
            {creadoPor ? <Dato etiqueta="Lo mandó" valor={creadoPor.nombre} /> : null}
          </TarjetaDatos>
          {detalle.sinConfirmar > 0 ? (
            <Text variant="caption" tone="muted">
              Esperando la confirmación de {contar(detalle.sinConfirmar, 'teléfono', 'teléfonos')}:
              llega 15-20 minutos después. Tirá para abajo para actualizar.
            </Text>
          ) : null}
        </Seccion>

        {errores.length > 0 ? (
          <Seccion titulo="Errores de Expo">
            <TarjetaDatos>
              {errores.map(([codigo, cantidad]) => (
                <Dato key={codigo} etiqueta={codigo} valor={contar(cantidad, 'vez', 'veces')} />
              ))}
            </TarjetaDatos>
            <Text variant="caption" tone="muted">
              DeviceNotRegistered es alguien que desinstaló la app: el servidor borra ese teléfono
              solo.
            </Text>
          </Seccion>
        ) : null}
      </ScrollView>

      <Modal
        visible={borrar.confirmando}
        onClose={borrar.cancelar}
        cerrarAlTocarFondo={!borrar.borrando}
        titulo="Borrar el aviso"
        descripcion="Lo saca del historial y de la pantalla de avisos de la app. La notificación que ya llegó a los teléfonos no se puede borrar: si hubo un error, mandá otro con la corrección."
        acciones={
          <>
            <Button
              label="Cancelar"
              variant="ghost"
              onPress={borrar.cancelar}
              disabled={borrar.borrando}
            />
            <Button
              label="Borrar"
              variant="danger"
              onPress={borrar.confirmar}
              loading={borrar.borrando}
            />
          </>
        }
      >
        {borrar.error ? (
          <Text variant="caption" tone="error">
            {borrar.error}
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
    chips: { flexDirection: 'row', gap: theme.spacing.xs },
  });
