import { useRouter } from 'expo-router';
import { Receipt, Search } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { Button, EstadoVacio, Input, Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { ChipsFiltro, FilaFactura } from '../../components';
import { useFacturas } from '../../hooks';
import type { FacturaEnLista } from '../../types';

/** Fuera del componente: no depende de nada y asi no se recrea en cada render. */
const claveDeFactura = (factura: FacturaEnLista) => factura.id;

/**
 * Listado de facturacion: la cuenta de cada cliente, periodo por periodo.
 *
 * La busqueda va con debounce y la paginacion con scroll infinito; las dos
 * viven en `useFacturas`, la pantalla solo dibuja lo que recibe.
 */
export function FacturasMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const lista = useFacturas();
  const refresco = useRefrescar(lista.refrescar);

  const irAlDetalle = useCallback((id: string) => router.push(`/admin/facturas/${id}`), [router]);

  const renderFila = useCallback(
    ({ item }: { item: FacturaEnLista }) => <FilaFactura factura={item} onPress={irAlDetalle} />,
    [irAlDetalle],
  );

  return (
    <Pantalla
      titulo="Facturación"
      descripcion={lista.total > 0 ? `${lista.total} en total` : 'La cuenta de cada cliente.'}
    >
      <View style={styles.filtros}>
        <Input
          value={lista.buscar}
          onChangeText={lista.setBuscar}
          placeholder="Buscar por cliente o DNI"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar facturas por cliente o DNI"
          leftSlot={<Search size={18} color={theme.colors.textMuted} />}
        />
        <ChipsFiltro activo={lista.filtro} onCambiar={lista.setFiltro} />
      </View>

      {/* La primera carga tapa la lista; refrescar y traer mas paginas no, que
          para eso estan la rueda del gesto y el pie de la lista. */}
      {lista.cargando && !refresco.refrescando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lista.facturas}
          keyExtractor={claveDeFactura}
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
              icono={
                <Receipt size={theme.typography.size.heading} color={theme.colors.textMuted} />
              }
              titulo={
                lista.error
                  ? 'No pudimos traer las facturas'
                  : lista.hayFiltros
                    ? 'Ninguna factura coincide'
                    : 'Todavía no hay facturas'
              }
              descripcion={
                lista.error ??
                (lista.hayFiltros
                  ? 'Probá con otro cliente, o sacá los filtros.'
                  : 'A cada cliente se le abre su cuenta al darlo de alta. Cargá un ticket y va a aparecer acá.')
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
                ) : null
              }
            />
          }
          ListFooterComponent={
            lista.cargandoMas ? (
              <View style={styles.pie}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : !lista.hayMas && lista.facturas.length > 0 ? (
              <Text variant="caption" tone="muted" center style={styles.pie}>
                No hay más facturas.
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
    // `flexGrow` deja el estado vacio centrado en vez de pegado arriba.
    lista: { flexGrow: 1, gap: theme.spacing.sm, paddingBottom: theme.spacing.lg },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pie: { paddingVertical: theme.spacing.md },
  });
