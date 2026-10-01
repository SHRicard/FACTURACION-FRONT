import { useRouter } from 'expo-router';
import { Plus, Search, Users } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { SelectorOpciones } from '@/features/metricas/components';
import { useRefrescar } from '@/shared/hooks';
import { Button, EstadoVacio, Input, Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { FilaUsuario } from '../../components';
import { FILTROS_RAPIDOS_USUARIOS, useUsuarios } from '../../hooks';
import type { UsuarioEnListado } from '../../types';

const claveDeUsuario = (usuario: UsuarioEnListado) => usuario.id;

/**
 * Todas las cuentas de la plataforma: busca por nombre, email o DNI, filtra
 * por estado y lleva a cada ficha.
 */
export function UsuariosMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const lista = useUsuarios();
  const refresco = useRefrescar(lista.refrescar);

  const irAlDetalle = useCallback(
    (id: string) => router.push(`/super-admin/usuarios/${id}`),
    [router],
  );
  const irAlAlta = useCallback(() => router.push('/super-admin/usuarios/nuevo'), [router]);

  const renderFila = useCallback(
    ({ item }: { item: UsuarioEnListado }) => <FilaUsuario usuario={item} onPress={irAlDetalle} />,
    [irAlDetalle],
  );

  return (
    <Pantalla
      titulo="Usuarios"
      descripcion={lista.total > 0 ? `${lista.total} cuentas` : 'Las cuentas de la plataforma.'}
      accion={
        <Button
          label="Crear"
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
          placeholder="Nombre, email o DNI"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar cuentas por nombre, email o DNI"
          leftSlot={<Search size={18} color={theme.colors.textMuted} />}
        />
        <SelectorOpciones
          opciones={FILTROS_RAPIDOS_USUARIOS}
          activa={lista.filtro}
          onCambiar={lista.setFiltro}
          etiqueta="Filtrar cuentas"
        />
      </View>

      {lista.cargando && !refresco.refrescando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lista.usuarios}
          keyExtractor={claveDeUsuario}
          renderItem={renderFila}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={refresco.control}
          onEndReachedThreshold={0.4}
          onEndReached={lista.cargarMas}
          ListEmptyComponent={
            <EstadoVacio
              icono={<Users size={theme.typography.size.heading} color={theme.colors.textMuted} />}
              titulo={
                lista.error
                  ? 'No pudimos traer las cuentas'
                  : lista.hayFiltros
                    ? 'Ninguna cuenta coincide'
                    : 'Todavía no hay cuentas'
              }
              descripcion={
                lista.error ??
                (lista.hayFiltros ? 'Probá con otra búsqueda o sacá el filtro.' : undefined)
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
                ) : undefined
              }
            />
          }
          ListFooterComponent={
            lista.cargandoMas ? (
              <View style={styles.pie}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : !lista.hayMas && lista.usuarios.length > 0 ? (
              <Text variant="caption" tone="muted" center style={styles.pie}>
                No hay más cuentas.
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
    lista: { flexGrow: 1, gap: theme.spacing.sm, paddingBottom: theme.spacing.lg },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pie: { paddingVertical: theme.spacing.md },
  });
