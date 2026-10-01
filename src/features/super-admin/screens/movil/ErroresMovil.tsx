import { useRouter } from 'expo-router';
import { Bug, Search } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { ChipFiltro } from '@/features/clientes/components';
import { Pestanas, SelectorOpciones } from '@/features/metricas/components';
import { useRefrescar } from '@/shared/hooks';
import { Button, EstadoVacio, Input, Pantalla, Text } from '@/shared/ui/atoms';
import { contar } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { FilaErrorApp } from '../../components';
import { DIAS_ERRORES, ORDENES_ERRORES, PLATAFORMAS_ERRORES, useErrores } from '../../hooks';
import type { GrupoError } from '../../types';

const claveDeGrupo = (grupo: GrupoError) => grupo.huella;

/**
 * Los errores que mando la app, agrupados. Los mensajes ya vienen redactados
 * (sin emails, DNIs ni tokens) y Mongo los borra a los 30 dias.
 */
export function ErroresMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const lista = useErrores();
  const refresco = useRefrescar(lista.refrescar);

  const irAlDetalle = useCallback(
    (huella: string) => router.push(`/super-admin/errores/${huella}`),
    [router],
  );

  const renderFila = useCallback(
    ({ item }: { item: GrupoError }) => <FilaErrorApp grupo={item} onPress={irAlDetalle} />,
    [irAlDetalle],
  );

  return (
    <Pantalla
      titulo="Errores"
      descripcion={
        lista.total > 0
          ? `${contar(lista.total, 'error distinto', 'errores distintos')} · ${contar(lista.ocurrencias, 'reporte', 'reportes')}`
          : 'Lo que reportó la app.'
      }
    >
      <View style={styles.filtros}>
        <Input
          value={lista.buscar}
          onChangeText={lista.setBuscar}
          placeholder="Mensaje, tipo o pantalla"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar errores"
          leftSlot={<Search size={18} color={theme.colors.textMuted} />}
        />
        <Pestanas opciones={ORDENES_ERRORES} activa={lista.orden} onCambiar={lista.setOrden} />
        <SelectorOpciones
          opciones={DIAS_ERRORES}
          activa={lista.dias}
          onCambiar={lista.setDias}
          etiqueta="Lapso"
        />
        <View style={styles.fila}>
          <SelectorOpciones
            opciones={PLATAFORMAS_ERRORES}
            activa={lista.plataforma}
            onCambiar={lista.setPlataforma}
            etiqueta="Plataforma"
          />
        </View>
        <View style={styles.fila}>
          <ChipFiltro
            label="Solo fatales"
            activo={lista.soloFatales}
            onPress={lista.alternarFatales}
          />
        </View>
      </View>

      {lista.cargando && !refresco.refrescando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lista.grupos}
          keyExtractor={claveDeGrupo}
          renderItem={renderFila}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={refresco.control}
          onEndReachedThreshold={0.4}
          onEndReached={lista.cargarMas}
          ListEmptyComponent={
            <EstadoVacio
              icono={<Bug size={theme.typography.size.heading} color={theme.colors.textMuted} />}
              titulo={
                lista.error
                  ? 'No pudimos traer los errores'
                  : lista.hayFiltros
                    ? 'Ningún error coincide'
                    : 'Sin errores en este lapso'
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
            ) : !lista.hayMas && lista.grupos.length > 0 ? (
              <Text variant="caption" tone="muted" center style={styles.pie}>
                No hay más errores.
              </Text>
            ) : null
          }
        />
      )}
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    filtros: { gap: theme.spacing.sm, marginBottom: theme.spacing.md },
    fila: { flexDirection: 'row' },
    lista: { flexGrow: 1, gap: theme.spacing.sm, paddingBottom: theme.spacing.lg },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pie: { paddingVertical: theme.spacing.md },
  });
