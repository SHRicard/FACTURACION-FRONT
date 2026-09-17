import { useRouter } from 'expo-router';
import { Repeat } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { Badge, Button, EstadoVacio, Pantalla } from '@/shared/ui/atoms';
import { formatearFechaCorta } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import {
  CifraDestacada,
  RenglonCliente,
  SelectorOpciones,
  SelectorPeriodo,
} from '../../components';
import { contar, diaYMes, haceDias, textoDias } from '../../formato';
import { FILTROS_FRECUENCIA, useFrecuenciaCompra, useNavegarMetricas } from '../../hooks';
import type { FrecuenciaCliente } from '../../types';

/** Un cliente sin id no deberia repetirse: su lugar en la lista alcanza. */
const claveDeCliente = (item: FrecuenciaCliente, indice: number) =>
  item.cliente?.id ?? `sin-cliente-${indice}`;

/** "Cada 26 dias · vuelve ~01/10", o la unica visita si no hay ritmo todavia. */
function lineaRitmo(item: FrecuenciaCliente): string {
  if (item.diasEntreCompras === null) {
    const fecha = formatearFechaCorta(item.ultimaCompra);
    return fecha ? `Vino una sola vez, el ${fecha}` : 'Vino una sola vez';
  }
  const proxima = diaYMes(item.proximaCompra);
  return `Cada ${textoDias(item.diasEntreCompras)}${proxima ? ` · vuelve ~${proxima}` : ''}`;
}

/**
 * Frecuencia de compra: cada cuanto vuelve cada cliente. Los demorados, los que
 * pasaron mas de 1,5 veces su ritmo sin volver, llevan un chip naranja.
 */
export function FrecuenciaCompraMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const lista = useFrecuenciaCompra();
  const refresco = useRefrescar(lista.refrescar);
  const { irAlCliente } = useNavegarMetricas();

  const renderFila = useCallback(
    ({ item }: { item: FrecuenciaCliente }) => (
      <RenglonCliente
        cliente={item.cliente}
        lineas={[lineaRitmo(item), `Última compra ${haceDias(item.diasDesdeUltima)}`]}
        valor={String(item.visitas)}
        detalleValor={item.visitas === 1 ? 'visita' : 'visitas'}
        avisos={
          item.estado === 'demorado' ? (
            <Badge label="Demorado" tone="warning" />
          ) : item.estado === 'sin-historial' ? (
            <Badge label="Sin ritmo todavía" tone="neutral" />
          ) : null
        }
        onPress={irAlCliente}
      />
    ),
    [irAlCliente],
  );

  const { resumen } = lista;

  const encabezado = resumen ? (
    <View style={styles.encabezado}>
      <CifraDestacada
        etiqueta="Tus clientes vuelven"
        valor={
          resumen.diasEntreCompras === null ? '—' : `cada ${textoDias(resumen.diasEntreCompras)}`
        }
        detalle={
          resumen.clientes > 0
            ? `${contar(resumen.clientes, 'cliente compró', 'clientes compraron')} en el período · ${contar(resumen.demorados, 'demorado', 'demorados')}.`
            : undefined
        }
        tonoDetalle={resumen.demorados > 0 ? 'warning' : 'muted'}
      />
    </View>
  ) : null;

  return (
    <Pantalla
      titulo="Frecuencia de compra"
      descripcion="Se cuentan visitas, no tickets: dos compras el mismo día son una vez que vino."
      ancho="contenido"
      onVolver={() => router.back()}
      labelVolver="Métricas"
    >
      <View style={styles.filtros}>
        <SelectorPeriodo
          activo={lista.periodo}
          onCambiar={lista.setPeriodo}
          periodo={lista.rango}
          actualizando={lista.actualizando && !refresco.refrescando}
        />
        <SelectorOpciones
          opciones={FILTROS_FRECUENCIA}
          activa={lista.filtro}
          onCambiar={lista.setFiltro}
          etiqueta="Estado"
        />
      </View>

      {/* La primera carga tapa la lista; refrescar y traer mas paginas no. */}
      {lista.cargando && !refresco.refrescando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lista.clientes}
          keyExtractor={claveDeCliente}
          renderItem={renderFila}
          ListHeaderComponent={encabezado}
          style={lista.actualizando && !refresco.refrescando ? styles.actualizando : undefined}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={refresco.control}
          onEndReachedThreshold={0.4}
          onEndReached={lista.cargarMas}
          ListEmptyComponent={
            <EstadoVacio
              icono={<Repeat size={theme.typography.size.heading} color={theme.colors.textMuted} />}
              titulo={
                lista.error
                  ? 'No pudimos traer la frecuencia'
                  : lista.filtro === 'todos'
                    ? 'Nadie compró en este período'
                    : 'Nadie en este grupo'
              }
              descripcion={
                lista.error ??
                (lista.filtro === 'todos'
                  ? 'Probá con un período más largo.'
                  : 'Probá con otro estado o con un período más largo.')
              }
              accion={
                lista.error ? (
                  <Button label="Reintentar" variant="secondary" onPress={lista.reintentar} />
                ) : null
              }
            />
          }
          ListFooterComponent={
            lista.cargandoMas ? (
              <View style={styles.pie}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
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
    encabezado: { marginBottom: theme.spacing.sm },
    // `flexGrow` deja el estado vacio centrado en vez de pegado arriba.
    lista: { flexGrow: 1, gap: theme.spacing.sm, paddingBottom: theme.spacing.lg },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pie: { paddingVertical: theme.spacing.md },
    actualizando: { opacity: 0.5 },
  });
