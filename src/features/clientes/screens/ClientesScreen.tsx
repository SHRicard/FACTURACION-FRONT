import { useRouter } from 'expo-router';
import { Plus, Search, Users } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { Button, EstadoVacio, Input, Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { ChipFiltro, FilaCliente } from '../components';
import { useClientes } from '../hooks';
import type { ClienteEnLista } from '../types';

/** Fuera del componente: no depende de nada y asi no se recrea en cada render. */
const claveDeCliente = (cliente: ClienteEnLista) => cliente.id;

/**
 * Listado de clientes: busca, filtra y lleva a cada ficha.
 *
 * La busqueda va con debounce y la paginacion con scroll infinito; las dos
 * viven en `useClientes`, la pantalla solo dibuja lo que recibe.
 */
export function ClientesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const lista = useClientes();
  const refresco = useRefrescar(lista.refrescar);

  const irAlDetalle = useCallback((id: string) => router.push(`/admin/clientes/${id}`), [router]);

  const irAlAlta = useCallback(() => router.push('/admin/clientes/nuevo'), [router]);

  const renderFila = useCallback(
    ({ item }: { item: ClienteEnLista }) => <FilaCliente cliente={item} onPress={irAlDetalle} />,
    [irAlDetalle],
  );

  return (
    <Pantalla
      titulo="Clientes"
      descripcion={lista.total > 0 ? `${lista.total} en total` : 'A quien le facturas.'}
      accion={
        <Button
          label="Nuevo"
          size="sm"
          onPress={irAlAlta}
          leftIcon={<Plus size={16} color={theme.colors.onPrimary} />}
        />
      }
    >
      <View style={styles.filtros}>
        <Input
          value={lista.buscar}
          onChangeText={lista.setBuscar}
          placeholder="Buscar por nombre o DNI"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar clientes por nombre o DNI"
          leftSlot={<Search size={18} color={theme.colors.textMuted} />}
        />
        <View style={styles.chips}>
          <ChipFiltro
            label="Solo deudores"
            activo={lista.deudores}
            onPress={lista.alternarDeudores}
          />
          <ChipFiltro
            label="Solo vencidos"
            activo={lista.vencidos}
            onPress={lista.alternarVencidos}
          />
        </View>
      </View>

      {/* La primera carga tapa la lista; refrescar y traer mas paginas no, que
          para eso estan la rueda del gesto y el pie de la lista. */}
      {lista.cargando && !refresco.refrescando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lista.clientes}
          keyExtractor={claveDeCliente}
          renderItem={renderFila}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={refresco.control}
          // 0.4 y no 0.9: en una lista larga conviene pedir la pagina siguiente
          // antes de llegar al fondo, asi no se ve el hueco.
          onEndReachedThreshold={0.4}
          onEndReached={lista.cargarMas}
          ListEmptyComponent={
            <EstadoVacio
              icono={<Users size={theme.typography.size.heading} color={theme.colors.textMuted} />}
              titulo={
                lista.error
                  ? 'No pudimos traer los clientes'
                  : lista.hayFiltros
                    ? 'Ningun cliente coincide'
                    : 'Todavia no hay clientes'
              }
              descripcion={
                lista.error ??
                (lista.hayFiltros
                  ? 'Proba con otro nombre o DNI, o saca los filtros.'
                  : 'Carga el primero y vas a poder facturarle desde aca.')
              }
              accion={
                lista.error ? (
                  <Button label="Reintentar" variant="secondary" onPress={lista.reintentar} />
                ) : lista.hayFiltros ? (
                  <Button
                    label="Limpiar filtros"
                    variant="secondary"
                    onPress={lista.limpiarFiltros}
                  />
                ) : (
                  <Button label="Nuevo cliente" onPress={irAlAlta} />
                )
              }
            />
          }
          ListFooterComponent={
            lista.cargandoMas ? (
              <View style={styles.pie}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : !lista.hayMas && lista.clientes.length > 0 ? (
              <Text variant="caption" tone="muted" center style={styles.pie}>
                No hay mas clientes.
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
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    // `flexGrow` deja el estado vacio centrado en vez de pegado arriba.
    lista: { flexGrow: 1, gap: theme.spacing.sm, paddingBottom: theme.spacing.lg },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pie: { paddingVertical: theme.spacing.md },
  });
