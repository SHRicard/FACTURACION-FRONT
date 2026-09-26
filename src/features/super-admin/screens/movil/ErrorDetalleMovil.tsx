import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { Badge, BotonIcono, Button, EstadoVacio, Modal, Pantalla, Text } from '@/shared/ui/atoms';
import { contar } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { Dato, TarjetaDatos, TarjetaOcurrencia, tituloDeError } from '../../components';
import { formatearFechaHora, haceCuanto, TEXTO_PLATAFORMA } from '../../formato';
import { useErrorApp } from '../../hooks';
import type { OcurrenciaError } from '../../types';

const claveDeOcurrencia = (ocurrencia: OcurrenciaError) => ocurrencia.id;

/**
 * Un error de la app: el resumen del grupo arriba y cada vez que paso abajo,
 * con su stack. "Marcar resuelto" borra todos los reportes; si vuelve a pasar,
 * reaparece como nuevo.
 */
export function ErrorDetalleMovil() {
  const { huella } = useLocalSearchParams<{ huella: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const detalle = useErrorApp(huella);
  const refresco = useRefrescar(detalle.refrescar);
  const { resolver } = detalle;

  const volver = () => router.back();

  const renderOcurrencia = useCallback(
    ({ item }: { item: OcurrenciaError }) => <TarjetaOcurrencia ocurrencia={item} />,
    [],
  );

  if (detalle.cargando && !refresco.refrescando) {
    return (
      <Pantalla titulo="Error" ancho="contenido" onVolver={volver} labelVolver="Errores">
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  const { grupo } = detalle;

  if (!grupo) {
    return (
      <Pantalla titulo="Error" ancho="contenido" onVolver={volver} labelVolver="Errores">
        <EstadoVacio
          titulo={
            detalle.noExiste ? 'Este error ya no tiene reportes' : 'No pudimos traer el error'
          }
          descripcion={
            detalle.noExiste
              ? 'Lo marcaron como resuelto, o pasaron más de 30 días.'
              : (detalle.error ?? undefined)
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

  return (
    <Pantalla
      titulo={grupo.nombre ?? 'Error'}
      descripcion={`Últimos ${detalle.dias} días`}
      ancho="contenido"
      onVolver={volver}
      labelVolver="Errores"
      accion={
        <BotonIcono accessibilityLabel="Marcar como resuelto" onPress={resolver.pedir}>
          <CircleCheck size={22} color={theme.colors.primary} strokeWidth={1.9} />
        </BotonIcono>
      }
    >
      <FlatList
        data={detalle.ocurrencias}
        keyExtractor={claveDeOcurrencia}
        renderItem={renderOcurrencia}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        refreshControl={refresco.control}
        onEndReachedThreshold={0.4}
        onEndReached={detalle.cargarMas}
        ListHeaderComponent={
          <View style={styles.cabecera}>
            <Text variant="body" weight="medium" selectable style={styles.mono}>
              {tituloDeError(grupo)}
            </Text>
            <View style={styles.chips}>
              {grupo.fatales > 0 ? <Badge label={`${grupo.fatales} FATAL`} tone="error" /> : null}
              {grupo.plataformas.map((plataforma) => (
                <Badge key={plataforma} label={TEXTO_PLATAFORMA[plataforma]} tone="neutral" />
              ))}
            </View>
            <TarjetaDatos>
              <Dato
                etiqueta="Cuántas veces"
                valor={`${contar(grupo.cantidad, 'vez', 'veces')} · ${contar(grupo.usuariosAfectados, 'persona', 'personas')} · ${contar(grupo.marcasAfectadas, 'marca', 'marcas')}`}
              />
              {grupo.ruta ? <Dato etiqueta="Pantalla" valor={grupo.ruta} mono /> : null}
              <Dato etiqueta="Versiones" valor={grupo.versiones.join(', ') || 'Sin dato'} mono />
              <Dato etiqueta="Primera vez" valor={formatearFechaHora(grupo.primeraVez) ?? '—'} />
              <Dato
                etiqueta="Última vez"
                valor={`${haceCuanto(grupo.ultimaVez) ?? '—'} · ${formatearFechaHora(grupo.ultimaVez) ?? ''}`}
              />
              <Dato etiqueta="Huella" valor={grupo.huella} mono />
            </TarjetaDatos>
            <Text variant="title" weight="bold" accessibilityRole="header">
              {contar(detalle.totalOcurrencias, 'ocurrencia', 'ocurrencias')}
            </Text>
          </View>
        }
        ListFooterComponent={
          detalle.cargandoMas ? (
            <View style={styles.pie}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : null
        }
      />

      <Modal
        visible={resolver.confirmando}
        onClose={resolver.cancelar}
        cerrarAlTocarFondo={!resolver.enviando}
        titulo="Marcar como resuelto"
        descripcion="Borra todos los reportes de este error. Si vuelve a pasar, aparece como nuevo."
        acciones={
          <>
            <Button
              label="Cancelar"
              variant="ghost"
              onPress={resolver.cancelar}
              disabled={resolver.enviando}
            />
            <Button label="Resuelto" onPress={resolver.confirmar} loading={resolver.enviando} />
          </>
        }
      >
        {resolver.error ? (
          <Text variant="caption" tone="error">
            {resolver.error}
          </Text>
        ) : null}
      </Modal>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    lista: { gap: theme.spacing.sm, paddingBottom: theme.spacing.xl },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cabecera: { gap: theme.spacing.md, marginBottom: theme.spacing.sm },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
    mono: { fontFamily: theme.typography.mono },
    pie: { paddingVertical: theme.spacing.md },
  });
