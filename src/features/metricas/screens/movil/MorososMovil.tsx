import { useRouter } from 'expo-router';
import { CircleAlert, Minus, Search, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { useRefrescar, useWhatsApp } from '@/shared/hooks';
import {
  Badge,
  Button,
  EstadoVacio,
  Input,
  Pantalla,
  Text,
  type TextTone,
} from '@/shared/ui/atoms';
import { formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import {
  BotonWhatsApp,
  CifraDestacada,
  DatoChico,
  GraficoBarras,
  Pestanas,
  RenglonCliente,
  SelectorOpciones,
  SelectorPeriodo,
  type PuntoGrafico,
} from '../../components';
import {
  contar,
  diaYMes,
  etiquetaDelTramo,
  formatearCantidad,
  formatearPorcentaje,
  textoDias,
  textoPuntoMorosos,
  textoUltimaCompra,
  textoUltimoPago,
  textoVariacion,
} from '../../formato';
import { AGRUPACIONES, ORDENES_MOROSOS, useMorosos, useNavegarMetricas } from '../../hooks';
import type { Moroso } from '../../types';

/** Hasta 30 dias de atraso el chip va en ambar; despues, en rojo. */
const DIAS_ATRASO_GRAVE = 30;

/** Cada moroso tiene una sola factura activa: su id es unico en la lista. */
const claveDeMoroso = (moroso: Moroso) => moroso.factura;

/** Mas morosos que al empezar es malo; menos, bueno. */
function tonoVariacion(variacion: number): TextTone {
  if (variacion > 0) return 'error';
  if (variacion < 0) return 'success';
  return 'muted';
}

/**
 * Morosos: si la morosidad crece o baja, y a quien hay que ir a cobrar.
 *
 * Arriba el resumen de hoy, en el medio como fueron cambiando en el periodo, y
 * abajo la lista para salir a cobrar. Todo va dentro de la lista: el resumen y
 * el grafico se van con el scroll y dejan lugar a los renglones.
 */
export function MorososMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const lista = useMorosos();
  const refresco = useRefrescar(lista.refrescar);
  const { irAlHistorial } = useNavegarMetricas();
  const whatsapp = useWhatsApp();
  const { abrir, puedeAbrir } = whatsapp;

  // Tocar un moroso abre su historial completo: que compro, cuando pago y cuanto debe.
  const verHistorial = useCallback((id: string) => irAlHistorial(id, 'Morosos'), [irAlHistorial]);

  const { datos, puntoElegido } = lista;

  const puntos: PuntoGrafico[] = useMemo(
    () =>
      datos
        ? datos.evolucion.map((punto) => ({
            clave: punto.etiqueta,
            etiqueta: etiquetaDelTramo(punto.etiqueta, datos.agrupar),
            valor: punto.morosos,
            descripcion: textoPuntoMorosos(punto, datos.agrupar),
          }))
        : [],
    [datos],
  );

  const renderFila = useCallback(
    ({ item }: { item: Moroso }) => {
      const antes = item.reprogramada ? diaYMes(item.vencimientoOriginal ?? null) : null;
      const telefono = item.cliente?.telefono;

      return (
        <RenglonCliente
          cliente={item.cliente}
          posicion={item.posicion}
          lineas={[textoUltimoPago(item.diasSinPagar), textoUltimaCompra(item.ultimaCompra)]}
          valor={formatearMoneda(item.saldo)}
          detalleValor="vencido"
          tonoValor="error"
          avisos={
            <>
              <Badge
                label={`${textoDias(item.diasDeAtraso)} de atraso`}
                tone={item.diasDeAtraso > DIAS_ATRASO_GRAVE ? 'error' : 'warning'}
              />
              {antes ? <Badge label={`Reprogramada (antes: ${antes})`} tone="neutral" /> : null}
              {item.cliente && puedeAbrir(telefono) ? (
                <BotonWhatsApp nombre={item.cliente.nombre} onPress={() => void abrir(telefono)} />
              ) : null}
            </>
          }
          onPress={verHistorial}
        />
      );
    },
    [verHistorial, abrir, puedeAbrir],
  );

  const resumen = datos?.resumen;
  const variacion = resumen?.variacionEnElPeriodo ?? 0;
  const IconoVariacion = variacion > 0 ? TrendingUp : variacion < 0 ? TrendingDown : Minus;
  const colorVariacion =
    variacion > 0
      ? theme.colors.error
      : variacion < 0
        ? theme.colors.success
        : theme.colors.textMuted;

  const encabezado = (
    <View style={styles.encabezado}>
      <SelectorPeriodo
        activo={lista.periodo}
        onCambiar={lista.setPeriodo}
        periodo={datos?.periodo}
        actualizando={lista.actualizando && !refresco.refrescando}
      />

      {/* Con datos, un error de refresco no tapa nada: va como aviso arriba. */}
      {datos && lista.error ? (
        <Text variant="caption" tone="error">
          {lista.error}
        </Text>
      ) : null}

      {datos && resumen ? (
        <>
          <CifraDestacada
            etiqueta="Morosos hoy"
            valor={formatearCantidad(resumen.morosos)}
            detalle={`${formatearPorcentaje(resumen.porcentajeDeClientes)} de tus ${contar(resumen.clientes, 'cliente', 'clientes')}`}
          >
            <View style={styles.variacion}>
              <IconoVariacion size={18} color={colorVariacion} />
              <Text variant="body" weight="bold" tone={tonoVariacion(variacion)}>
                {textoVariacion(variacion)}
              </Text>
              <Text variant="caption" tone="muted">
                {`· había ${contar(resumen.alInicioDelPeriodo, 'moroso', 'morosos')} al empezar`}
              </Text>
            </View>
          </CifraDestacada>

          <View style={styles.datos}>
            <DatoChico
              etiqueta="Vencido"
              valor={formatearMoneda(resumen.montoVencido)}
              tono={resumen.montoVencido > 0 ? 'error' : 'default'}
              detalle="Lo que deben todos los morosos"
            />
            <DatoChico
              etiqueta="Atraso promedio"
              valor={
                resumen.diasPromedioDeAtraso === null
                  ? '—'
                  : textoDias(resumen.diasPromedioDeAtraso)
              }
              detalle="Desde que vencieron"
            />
          </View>

          <View style={styles.seccion}>
            <Text variant="title" weight="bold" accessibilityRole="header">
              Cómo fueron cambiando
            </Text>
            <Pestanas opciones={AGRUPACIONES} activa={lista.agrupar} onCambiar={lista.setAgrupar} />
            <GraficoBarras
              puntos={puntos}
              tono="error"
              elegida={puntoElegido?.etiqueta ?? null}
              onElegir={lista.elegirPunto}
            />
            {puntoElegido ? (
              <Text variant="caption" tone="muted" accessibilityLiveRegion="polite">
                {textoPuntoMorosos(puntoElegido, datos.agrupar)}
              </Text>
            ) : null}
            <Text variant="caption" tone="muted">
              Cuentan también los que después pagaron: en la lista de hoy ya no están, pero en el
              gráfico sí.
            </Text>
          </View>

          <View style={styles.seccion}>
            <Text variant="title" weight="bold" accessibilityRole="header">
              La lista de hoy
            </Text>
            <Input
              value={lista.buscar}
              onChangeText={lista.setBuscar}
              placeholder="Buscar por nombre o DNI"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Buscar morosos por nombre o DNI"
              leftSlot={<Search size={18} color={theme.colors.textMuted} />}
            />
            <SelectorOpciones
              opciones={ORDENES_MOROSOS}
              activa={lista.orden}
              onCambiar={lista.setOrden}
              etiqueta="Ordenar"
            />
            {whatsapp.error ? (
              <Text variant="caption" tone="error">
                {whatsapp.error}
              </Text>
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );

  return (
    <Pantalla
      titulo="Morosos"
      descripcion="Los que tienen la factura vencida y todavía deben."
      ancho="contenido"
      onVolver={() => router.back()}
      labelVolver="Métricas"
    >
      {/* La primera carga tapa la pantalla; refrescar y traer mas paginas no, que
          para eso estan la rueda del gesto y el pie de la lista. */}
      {lista.cargando && !refresco.refrescando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lista.morosos}
          keyExtractor={claveDeMoroso}
          renderItem={renderFila}
          ListHeaderComponent={encabezado}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refresco.control}
          onEndReachedThreshold={0.4}
          onEndReached={lista.cargarMas}
          ListEmptyComponent={
            <EstadoVacio
              icono={
                <CircleAlert size={theme.typography.size.heading} color={theme.colors.textMuted} />
              }
              titulo={
                !datos
                  ? 'No pudimos traer los morosos'
                  : lista.buscando
                    ? 'Nadie coincide'
                    : 'No hay morosos'
              }
              descripcion={
                !datos
                  ? (lista.error ?? 'Probá de nuevo en un rato.')
                  : lista.buscando
                    ? 'Probá con otro nombre o DNI.'
                    : 'Nadie tiene la factura vencida con deuda.'
              }
              accion={
                !datos ? (
                  <Button label="Reintentar" variant="secondary" onPress={lista.reintentar} />
                ) : lista.buscando ? (
                  <Button
                    label="Limpiar búsqueda"
                    variant="secondary"
                    onPress={lista.limpiarBusqueda}
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
            ) : !lista.hayMas && lista.morosos.length > 0 ? (
              <Text variant="caption" tone="muted" center style={styles.pie}>
                No hay más morosos.
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
    encabezado: { gap: theme.spacing.md, marginBottom: theme.spacing.sm },
    variacion: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    datos: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    seccion: { gap: theme.spacing.sm },
    // `flexGrow` deja el estado vacio centrado en vez de pegado arriba.
    lista: { flexGrow: 1, gap: theme.spacing.sm, paddingBottom: theme.spacing.lg },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pie: { paddingVertical: theme.spacing.md },
  });
