import { useRouter } from 'expo-router';
import { Calculator, Search, Store } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { Pestanas, SelectorOpciones } from '@/features/metricas/components';
import { useRefrescar } from '@/shared/hooks';
import { BotonIcono, Button, EstadoVacio, Input, Modal, Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { FilaMarca } from '../../components';
import { ACTIVIDADES_MARCAS, ORDENES_MARCAS, useMarcas } from '../../hooks';
import type { MarcaEnListado } from '../../types';

const claveDeMarca = (marca: MarcaEnListado) => marca.id;

/**
 * Todas las marcas: cuanto mueve cada una y cuales estan dormidas. El boton
 * de la calculadora es de soporte: recalcula las estadisticas de todas.
 */
export function MarcasMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const lista = useMarcas();
  const refresco = useRefrescar(lista.refrescar);
  const { recalculo } = lista;

  const irAlDetalle = useCallback(
    (id: string) => router.push(`/super-admin/marcas/${id}`),
    [router],
  );

  const renderFila = useCallback(
    ({ item }: { item: MarcaEnListado }) => <FilaMarca marca={item} onPress={irAlDetalle} />,
    [irAlDetalle],
  );

  return (
    <Pantalla
      titulo="Marcas"
      descripcion={lista.total > 0 ? `${lista.total} marcas` : 'Los negocios de la plataforma.'}
      accion={
        <BotonIcono accessibilityLabel="Recalcular todas las marcas" onPress={recalculo.pedir}>
          <Calculator size={22} color={theme.colors.primary} strokeWidth={1.9} />
        </BotonIcono>
      }
    >
      <View style={styles.filtros}>
        <Input
          value={lista.buscar}
          onChangeText={lista.setBuscar}
          placeholder="Buscar por nombre"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar marcas por nombre"
          leftSlot={<Search size={18} color={theme.colors.textMuted} />}
        />
        <Pestanas
          opciones={ACTIVIDADES_MARCAS}
          activa={lista.actividad}
          onCambiar={lista.setActividad}
        />
        <SelectorOpciones
          opciones={ORDENES_MARCAS}
          activa={lista.orden}
          onCambiar={lista.setOrden}
          etiqueta="Ordenar marcas"
        />
        {recalculo.aviso ? (
          <Text variant="caption" tone="success" accessibilityRole="alert">
            {recalculo.aviso}
          </Text>
        ) : null}
      </View>

      {lista.cargando && !refresco.refrescando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lista.marcas}
          keyExtractor={claveDeMarca}
          renderItem={renderFila}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={refresco.control}
          onEndReachedThreshold={0.4}
          onEndReached={lista.cargarMas}
          ListEmptyComponent={
            <EstadoVacio
              icono={<Store size={theme.typography.size.heading} color={theme.colors.textMuted} />}
              titulo={
                lista.error
                  ? 'No pudimos traer las marcas'
                  : lista.hayFiltros
                    ? 'Ninguna marca coincide'
                    : 'Todavía no hay marcas'
              }
              descripcion={lista.error ?? undefined}
              accion={
                lista.error ? (
                  <Button label="Reintentar" variant="secondary" onPress={lista.reintentar} />
                ) : lista.hayFiltros ? (
                  <Button
                    label="Limpiar filtros"
                    variant="secondary"
                    onPress={lista.limpiarFiltros}
                  />
                ) : undefined
              }
            />
          }
          ListFooterComponent={
            lista.cargandoMas ? (
              <View style={styles.pie}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : !lista.hayMas && lista.marcas.length > 0 ? (
              <Text variant="caption" tone="muted" center style={styles.pie}>
                No hay más marcas.
              </Text>
            ) : null
          }
        />
      )}

      <Modal
        visible={recalculo.confirmando}
        onClose={recalculo.cancelar}
        cerrarAlTocarFondo={!recalculo.recalculando}
        titulo="Recalcular todas las marcas"
        descripcion="Rehace las estadísticas de cada marca. Es para soporte, si algún número no cierra. Puede tardar unos segundos."
        acciones={
          <>
            <Button
              label="Cancelar"
              variant="ghost"
              onPress={recalculo.cancelar}
              disabled={recalculo.recalculando}
            />
            <Button
              label="Recalcular"
              onPress={recalculo.confirmar}
              loading={recalculo.recalculando}
            />
          </>
        }
      />
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    filtros: { gap: theme.spacing.sm, marginBottom: theme.spacing.md },
    lista: { flexGrow: 1, gap: theme.spacing.sm, paddingBottom: theme.spacing.lg },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pie: { paddingVertical: theme.spacing.md },
  });
