import { useRouter } from 'expo-router';
import { UserRoundX } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { Badge, Button, EstadoVacio, Pantalla, Text } from '@/shared/ui/atoms';
import { formatearFechaCorta, formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { CifraDestacada, RenglonCliente, SelectorOpciones } from '../../components';
import { contar, haceDias } from '../../formato';
import { DIAS_INACTIVO, useClientesInactivos, useNavegarMetricas } from '../../hooks';
import type { ClienteInactivo } from '../../types';

/** Un cliente sin id no deberia repetirse: su lugar en la lista alcanza. */
const claveDeInactivo = (item: ClienteInactivo, indice: number) =>
  item.cliente?.id ?? `sin-cliente-${indice}`;

/** "Ultima compra hace 105 dias (01/06/2026)". */
function lineaCompra(item: ClienteInactivo): string {
  if (!item.ultimaCompra || item.diasSinComprar === null) return 'No tiene compras que cuenten';
  const fecha = formatearFechaCorta(item.ultimaCompra.fecha);
  return `Última compra ${haceDias(item.diasSinComprar)}${fecha ? ` (${fecha})` : ''}`;
}

/**
 * El ultimo pago distingue al que no compra pero sigue pagando del que
 * desaparecio: no son el mismo llamado.
 */
function lineaPago(item: ClienteInactivo): string {
  if (!item.ultimoPago) return 'Nunca pagó nada a cuenta';
  const fecha = formatearFechaCorta(item.ultimoPago.fecha);
  const monto =
    item.ultimoPago.monto !== undefined ? ` · ${formatearMoneda(item.ultimoPago.monto)}` : '';
  return `Último pago ${fecha ?? ''}${monto}`;
}

/**
 * Dejaron de comprar y todavia deben. Arriba cuanto hay en riesgo; abajo, cada
 * uno con hace cuanto no viene y su ultimo pago.
 */
export function ClientesInactivosMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const lista = useClientesInactivos();
  const refresco = useRefrescar(lista.refrescar);
  const { irAlCliente } = useNavegarMetricas();

  const renderFila = useCallback(
    ({ item }: { item: ClienteInactivo }) => (
      <RenglonCliente
        cliente={item.cliente}
        lineas={[lineaCompra(item), lineaPago(item)]}
        valor={formatearMoneda(item.saldo)}
        detalleValor="debe"
        tonoValor={item.saldoVencido > 0 ? 'error' : 'default'}
        avisos={item.ultimoPago ? null : <Badge label="Sin pagos" tone="error" />}
        onPress={irAlCliente}
      />
    ),
    [irAlCliente],
  );

  const { resumen } = lista;

  const encabezado = resumen ? (
    <View style={styles.encabezado}>
      <CifraDestacada
        etiqueta="En riesgo"
        valor={formatearMoneda(resumen.deuda)}
        detalle={
          resumen.clientes > 0
            ? `En ${contar(resumen.clientes, 'cliente que no compra', 'clientes que no compran')} hace más de ${lista.dias} días.`
            : undefined
        }
        tonoDetalle="muted"
      />
    </View>
  ) : null;

  return (
    <Pantalla
      titulo="Dejaron de comprar"
      descripcion="Y todavía deben. El que dejó de venir con la cuenta abierta es el que más fácil se pierde."
      ancho="contenido"
      onVolver={() => router.back()}
      labelVolver="Métricas"
    >
      <View style={styles.filtros}>
        <Text variant="caption" tone="muted">
          Sin comprar hace más de
        </Text>
        <SelectorOpciones
          opciones={DIAS_INACTIVO}
          activa={lista.dias}
          onCambiar={lista.setDias}
          etiqueta="Días sin comprar"
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
          keyExtractor={claveDeInactivo}
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
              icono={
                <UserRoundX size={theme.typography.size.heading} color={theme.colors.textMuted} />
              }
              titulo={lista.error ? 'No pudimos traer la lista' : 'Nadie en riesgo'}
              descripcion={
                lista.error ?? `Todos los que deben compraron en los últimos ${lista.dias} días.`
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
    filtros: { gap: theme.spacing.xs, marginBottom: theme.spacing.md },
    encabezado: { marginBottom: theme.spacing.sm },
    // `flexGrow` deja el estado vacio centrado en vez de pegado arriba.
    lista: { flexGrow: 1, gap: theme.spacing.sm, paddingBottom: theme.spacing.lg },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pie: { paddingVertical: theme.spacing.md },
    actualizando: { opacity: 0.5 },
  });
