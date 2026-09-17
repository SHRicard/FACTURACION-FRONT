import { useLocalSearchParams, useRouter } from 'expo-router';
import { Receipt } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { useRefrescar, useWhatsApp } from '@/shared/hooks';
import { Button, EstadoVacio, Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import {
  ChipFiltro,
  FacturaDelHistorial,
  MovimientoHistorial,
  ResumenHistorial,
} from '../../components';
import { TIPOS_MOVIMIENTO, useHistorialCliente } from '../../hooks';
import type { Movimiento, TipoMovimiento } from '../../types';

/** Una compra y un pago viven en colecciones distintas: el tipo desempata el id. */
const claveDeMovimiento = (movimiento: Movimiento) => `${movimiento.tipo}-${movimiento.id}`;

const VACIO_POR_TIPO: Record<TipoMovimiento, string> = {
  todos: 'Todavía no tiene movimientos.',
  compras: 'Todavía no compró nada.',
  pagos: 'Todavía no dejó ningún pago a cuenta.',
};

/**
 * El historial completo de un cliente: cuanto debe y como viene, sus facturas,
 * y todo lo que compro y pago, del mas nuevo al mas viejo.
 *
 * Se abre desde Morosos (en el stack de Mas) y desde la ficha (en el de
 * Clientes). Es la misma pantalla: `volver` dice que dice la flecha, y sin el
 * se vino desde la ficha.
 */
export function HistorialClienteMovil() {
  const params = useLocalSearchParams<{ id: string; volver?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const historial = useHistorialCliente(params.id);
  const refresco = useRefrescar(historial.refrescar);
  const whatsapp = useWhatsApp();

  const vieneDeLaFicha = !params.volver;
  const labelVolver = params.volver ?? 'Cliente';
  const volver = () => router.back();

  /*
   * La ficha y la factura viven en otros tabs. `withAnchor` deja la lista de
   * ese tab debajo: sin eso el tab queda con una pantalla suelta y "atras" cae
   * en el Dashboard. Desde la ficha, la ficha es la pantalla de atras.
   */
  const irALaFicha = () =>
    vieneDeLaFicha
      ? router.back()
      : router.push(`/admin/clientes/${params.id}`, { withAnchor: true });

  const irALaFactura = useCallback(
    (id: string) => router.push(`/admin/facturas/${id}`, { withAnchor: true }),
    [router],
  );

  const renderMovimiento = useCallback(
    ({ item }: { item: Movimiento }) => <MovimientoHistorial movimiento={item} />,
    [],
  );

  const { cliente, resumen } = historial;

  if (historial.cargando && !refresco.refrescando) {
    return (
      <Pantalla titulo="Historial" ancho="contenido" onVolver={volver} labelVolver={labelVolver}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  if (!cliente || !resumen) {
    return (
      <Pantalla titulo="Historial" ancho="contenido" onVolver={volver} labelVolver={labelVolver}>
        <EstadoVacio
          icono={<Receipt size={theme.typography.size.heading} color={theme.colors.textMuted} />}
          titulo={
            historial.sinServicio
              ? 'El historial todavía no está disponible'
              : historial.noExiste
                ? 'Este cliente no existe'
                : 'No pudimos traer el historial'
          }
          descripcion={
            historial.sinServicio
              ? 'Falta habilitarlo del lado del servidor. Mientras tanto, en la ficha están su deuda y su factura en curso.'
              : historial.noExiste
                ? 'Puede que lo hayan dado de baja, o que el link esté mal.'
                : (historial.error ?? 'Probá de nuevo en un rato.')
          }
          accion={
            historial.sinServicio ? (
              <Button label="Ver la ficha" variant="secondary" onPress={irALaFicha} />
            ) : historial.noExiste ? (
              <Button label="Volver" variant="secondary" onPress={volver} />
            ) : (
              <Button label="Reintentar" variant="secondary" onPress={historial.reintentar} />
            )
          }
        />
      </Pantalla>
    );
  }

  const encabezado = (
    <View style={styles.encabezado}>
      {/* Con datos, un error de refresco no tapa nada: va como aviso arriba. */}
      {historial.error ? (
        <Text variant="caption" tone="error">
          {historial.error}
        </Text>
      ) : null}

      <ResumenHistorial
        cliente={cliente}
        resumen={resumen}
        onWhatsApp={
          whatsapp.puedeAbrir(cliente.telefono)
            ? () => void whatsapp.abrir(cliente.telefono)
            : undefined
        }
      />
      {whatsapp.error ? (
        <Text variant="caption" tone="error">
          {whatsapp.error}
        </Text>
      ) : null}

      <View style={styles.seccion}>
        <Text variant="title" weight="bold" accessibilityRole="header">
          Facturas
        </Text>
        {historial.facturas.length > 0 ? (
          historial.facturas.map((factura) => (
            <FacturaDelHistorial key={factura.id} factura={factura} onPress={irALaFactura} />
          ))
        ) : (
          <Text variant="body" tone="muted">
            Todavía no tiene facturas.
          </Text>
        )}
      </View>

      <View style={styles.seccion}>
        <Text variant="title" weight="bold" accessibilityRole="header">
          Movimientos
        </Text>
        <View style={styles.filtros}>
          {TIPOS_MOVIMIENTO.map(({ clave, etiqueta }) => (
            <ChipFiltro
              key={clave}
              label={etiqueta}
              activo={historial.tipo === clave}
              onPress={() => historial.setTipo(clave)}
            />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <Pantalla
      titulo={cliente.nombre}
      descripcion={`Historial · DNI ${cliente.dni}`}
      ancho="contenido"
      onVolver={volver}
      labelVolver={labelVolver}
    >
      <FlatList
        data={historial.movimientos}
        keyExtractor={claveDeMovimiento}
        renderItem={renderMovimiento}
        ListHeaderComponent={encabezado}
        // Cambio el filtro: lo de antes sigue a la vista, pero se nota que no es lo nuevo.
        style={historial.actualizando && !refresco.refrescando ? styles.actualizando : undefined}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        refreshControl={refresco.control}
        onEndReachedThreshold={0.4}
        onEndReached={historial.cargarMas}
        ListEmptyComponent={
          <Text variant="body" tone="muted">
            {VACIO_POR_TIPO[historial.tipo]}
          </Text>
        }
        ListFooterComponent={
          historial.cargandoMas ? (
            <View style={styles.pie}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : !historial.hayMas && historial.movimientos.length > 0 ? (
            <Text variant="caption" tone="muted" center style={styles.pie}>
              No hay más movimientos.
            </Text>
          ) : null
        }
      />
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    encabezado: { gap: theme.spacing.md, marginBottom: theme.spacing.sm },
    seccion: { gap: theme.spacing.sm },
    filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    lista: { flexGrow: 1, gap: theme.spacing.sm, paddingBottom: theme.spacing.lg },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pie: { paddingVertical: theme.spacing.md },
    actualizando: { opacity: 0.5 },
  });
