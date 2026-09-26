import { useRouter } from 'expo-router';
import { Megaphone } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { Button, EstadoVacio, Pantalla } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { TarjetaAviso } from '../../components';
import { useAvisos } from '../../hooks';
import type { AvisoApp } from '../../types';

const claveDeAviso = (aviso: AvisoApp) => aviso.id;

/**
 * Los avisos de la app: mantenimientos, novedades y versiones nuevas. Abre
 * con o sin sesion: a esta pantalla se llega tocando una notificacion, y quien
 * la toco puede no haber entrado nunca.
 */
export function AvisosMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const lista = useAvisos();
  const refresco = useRefrescar(lista.refrescar);

  // Tocando la notificacion con la app cerrada no hay nada atras: a la raiz,
  // que decide a donde va segun la sesion.
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const renderAviso = useCallback(
    ({ item }: { item: AvisoApp }) => (
      <TarjetaAviso
        titulo={item.titulo}
        mensaje={item.mensaje}
        tipo={item.tipo}
        fecha={item.fecha}
        urlTienda={item.urlTienda}
        onActualizar={lista.abrirTienda}
      />
    ),
    [lista.abrirTienda],
  );

  return (
    <Pantalla
      titulo="Avisos"
      descripcion="Mantenimientos, novedades y versiones nuevas."
      ancho="contenido"
      onVolver={volver}
      labelVolver="Volver"
    >
      {lista.cargando && !refresco.refrescando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lista.avisos}
          keyExtractor={claveDeAviso}
          renderItem={renderAviso}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={refresco.control}
          ListEmptyComponent={
            <EstadoVacio
              icono={
                <Megaphone size={theme.typography.size.heading} color={theme.colors.textMuted} />
              }
              titulo={lista.error ? 'No pudimos traer los avisos' : 'No hay avisos por ahora'}
              descripcion={
                lista.error ?? 'Cuando haya un mantenimiento o algo nuevo, va a aparecer acá.'
              }
              accion={
                lista.error ? (
                  <Button label="Reintentar" variant="secondary" onPress={lista.reintentar} />
                ) : undefined
              }
            />
          }
        />
      )}
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    lista: { flexGrow: 1, gap: theme.spacing.sm, paddingBottom: theme.spacing.xl },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });
