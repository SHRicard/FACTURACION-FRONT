import { useRouter } from 'expo-router';
import { Megaphone, Plus } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { Button, EstadoVacio, Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { FilaAvisoAdmin } from '../../components';
import { useAvisosAdmin } from '../../hooks';
import type { AvisoAdmin } from '../../types';

const claveDeAviso = (aviso: AvisoAdmin) => aviso.id;

/**
 * El historial de avisos: lo que se mando como notificacion a todos los
 * telefonos, con su estado y a cuantos llego.
 */
export function AvisosAdminMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const lista = useAvisosAdmin();
  const refresco = useRefrescar(lista.refrescar);

  const irAlDetalle = useCallback(
    (id: string) => router.push(`/super-admin/mas/avisos/${id}`),
    [router],
  );
  const irAlNuevo = useCallback(() => router.push('/super-admin/mas/avisos/nuevo'), [router]);

  const renderFila = useCallback(
    ({ item }: { item: AvisoAdmin }) => <FilaAvisoAdmin aviso={item} onPress={irAlDetalle} />,
    [irAlDetalle],
  );

  return (
    <Pantalla
      titulo="Avisos"
      descripcion="Notificaciones a todos los que tienen la app."
      onVolver={() => router.back()}
      labelVolver="Más"
      accion={
        <Button
          label="Nuevo"
          size="sm"
          onPress={irAlNuevo}
          leftIcon={<Plus size={16} color={theme.colors.onPrimary} />}
        />
      }
    >
      {lista.cargando && !refresco.refrescando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lista.avisos}
          keyExtractor={claveDeAviso}
          renderItem={renderFila}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={refresco.control}
          onEndReachedThreshold={0.4}
          onEndReached={lista.cargarMas}
          ListEmptyComponent={
            <EstadoVacio
              icono={
                <Megaphone size={theme.typography.size.heading} color={theme.colors.textMuted} />
              }
              titulo={lista.error ? 'No pudimos traer los avisos' : 'Todavía no mandaste avisos'}
              descripcion={
                lista.error ??
                'Un mantenimiento, una novedad o una versión nueva: le llega a todos.'
              }
              accion={
                lista.error ? (
                  <Button label="Reintentar" variant="secondary" onPress={lista.reintentar} />
                ) : (
                  <Button label="Nuevo aviso" onPress={irAlNuevo} />
                )
              }
            />
          }
          ListFooterComponent={
            lista.cargandoMas ? (
              <View style={styles.pie}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : !lista.hayMas && lista.avisos.length > 0 ? (
              <Text variant="caption" tone="muted" center style={styles.pie}>
                No hay más avisos.
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
    lista: { flexGrow: 1, gap: theme.spacing.sm, paddingBottom: theme.spacing.lg },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pie: { paddingVertical: theme.spacing.md },
  });
