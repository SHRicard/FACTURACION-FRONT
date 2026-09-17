import { useRouter } from 'expo-router';
import { Minus, Search, TrendingDown, TrendingUp, Users } from 'lucide-react-native';
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
  etiquetaDelTramo,
  formatearPorcentaje,
  textoDias,
  textoPuntoDeudores,
  textoUltimaCompra,
  textoUltimoPago,
} from '../../formato';
import { AGRUPACIONES, ORDENES_DEUDORES, useDeudores, useNavegarMetricas } from '../../hooks';
import type { Deudor } from '../../types';

/**
 * Sin cliente no hay id por el que ordenar, pero la posicion es unica en la
 * lista: es el lugar en el ranking.
 */
const claveDeDeudor = (deudor: Deudor) => deudor.cliente?.id ?? `sin-cliente-${deudor.posicion}`;

/** Que la libreta crezca es malo; que se achique, bueno. */
function tonoVariacion(variacion: number): TextTone {
  if (variacion > 0) return 'error';
  if (variacion < 0) return 'success';
  return 'muted';
}

/** "La libreta creció $120.000" / "se achicó". */
function textoVariacionDeDeuda(variacion: number): string {
  if (variacion === 0) return 'La libreta quedó igual en el período';
  const cuanto = formatearMoneda(Math.abs(variacion));
  return variacion > 0
    ? `La libreta creció ${cuanto} en el período`
    : `La libreta se achicó ${cuanto} en el período`;
}

/**
 * Deudores: cuanta plata hay en la calle y quien la tiene.
 *
 * Deudor es quien debe algo, vencido o no; el moroso tiene su propia metrica.
 * Arriba la plata de hoy, en el medio como fue cambiando, y abajo la lista para
 * salir a cobrar. Tocar un renglon abre el historial del cliente.
 */
export function DeudoresMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const lista = useDeudores();
  const refresco = useRefrescar(lista.refrescar);
  const { irAlHistorial } = useNavegarMetricas();
  const whatsapp = useWhatsApp();
  const { abrir, puedeAbrir } = whatsapp;

  const { datos, puntoElegido } = lista;
  const resumen = datos?.resumen;

  // Tocar un deudor abre su historial completo: que compro, cuando pago y cuanto debe.
  const verHistorial = useCallback((id: string) => irAlHistorial(id, 'Deudores'), [irAlHistorial]);

  /** El grafico es la plata en la calle: es lo que se viene a mirar. */
  const puntos: PuntoGrafico[] = useMemo(
    () =>
      datos
        ? datos.evolucion.map((punto) => ({
            clave: punto.etiqueta,
            etiqueta: etiquetaDelTramo(punto.etiqueta, datos.agrupar ?? 'mes'),
            valor: punto.deudaTotal,
            descripcion: textoPuntoDeudores(punto, datos.agrupar ?? 'mes'),
          }))
        : [],
    [datos],
  );

  const renderFila = useCallback(
    ({ item }: { item: Deudor }) => {
      /*
       * `undefined` es "el backend todavia no manda el dato" (ver
       * `docs/DEUDORES.md`) y `null`, "no tiene": el primero no se muestra.
       */
      const lineas = [
        item.moroso
          ? `${formatearMoneda(item.saldoVencido)} ya vencido`
          : 'Todavía no le venció nada',
        item.ultimoPago === undefined ? null : textoUltimoPago(item.diasSinPagar ?? null),
        item.ultimaCompra === undefined ? null : textoUltimaCompra(item.ultimaCompra),
      ];
      const telefono = item.cliente?.telefono;

      return (
        <RenglonCliente
          cliente={item.cliente}
          posicion={item.posicion}
          lineas={lineas}
          valor={formatearMoneda(item.saldo)}
          detalleValor="debe"
          tonoValor={item.moroso ? 'error' : 'default'}
          avisos={
            <>
              {item.moroso ? (
                <Badge label={`${textoDias(item.diasDeAtraso)} de atraso`} tone="error" />
              ) : (
                <Badge label="Sin vencer" tone="primary" />
              )}
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

  const variacion = resumen?.variacionDeDeuda;
  const IconoVariacion =
    variacion === undefined || variacion === 0 ? Minus : variacion > 0 ? TrendingUp : TrendingDown;
  const colorVariacion =
    variacion === undefined || variacion === 0
      ? theme.colors.textMuted
      : variacion > 0
        ? theme.colors.error
        : theme.colors.success;

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

      {resumen ? (
        <>
          <CifraDestacada
            etiqueta="En la calle"
            valor={formatearMoneda(resumen.deudaTotal)}
            detalle={
              resumen.clientes === undefined
                ? `${contar(resumen.deudores, 'cliente debe', 'clientes deben')} algo`
                : `${contar(resumen.deudores, 'cliente', 'clientes')} de tus ${contar(resumen.clientes, 'cliente', 'clientes')} deben algo`
            }
          >
            {variacion === undefined ? null : (
              <View style={styles.variacion}>
                <IconoVariacion size={18} color={colorVariacion} />
                <Text variant="body" weight="bold" tone={tonoVariacion(variacion)}>
                  {textoVariacionDeDeuda(variacion)}
                </Text>
              </View>
            )}
          </CifraDestacada>

          <View style={styles.datos}>
            <DatoChico
              etiqueta="Ya vencido"
              valor={formatearMoneda(resumen.deudaVencida)}
              tono={resumen.deudaVencida > 0 ? 'error' : 'default'}
              detalle={`${formatearPorcentaje(resumen.porcentajeVencida)} del total · ${contar(resumen.morosos, 'moroso', 'morosos')}`}
            />
            <DatoChico
              etiqueta="Todavía no venció"
              valor={formatearMoneda(resumen.deudaTotal - resumen.deudaVencida)}
              detalle="Está en fecha"
            />
          </View>
        </>
      ) : null}

      {/* El grafico aparece cuando el backend manda la evolucion (docs/DEUDORES.md). */}
      {puntos.length > 0 ? (
        <View style={styles.seccion}>
          <Text variant="title" weight="bold" accessibilityRole="header">
            Cómo fue cambiando
          </Text>
          <Pestanas opciones={AGRUPACIONES} activa={lista.agrupar} onCambiar={lista.setAgrupar} />
          <GraficoBarras
            puntos={puntos}
            tono="primary"
            elegida={puntoElegido?.etiqueta ?? null}
            onElegir={lista.elegirPunto}
          />
          {puntoElegido ? (
            <Text variant="caption" tone="muted" accessibilityLiveRegion="polite">
              {textoPuntoDeudores(puntoElegido, datos?.agrupar ?? 'mes')}
            </Text>
          ) : null}
        </View>
      ) : null}

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
          accessibilityLabel="Buscar deudores por nombre o DNI"
          leftSlot={<Search size={18} color={theme.colors.textMuted} />}
        />
        <SelectorOpciones
          opciones={ORDENES_DEUDORES}
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
    </View>
  );

  return (
    <Pantalla
      titulo="Deudores"
      descripcion="Todos los que deben algo, vencido o no."
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
          data={lista.deudores}
          keyExtractor={claveDeDeudor}
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
              icono={<Users size={theme.typography.size.heading} color={theme.colors.textMuted} />}
              titulo={
                !datos
                  ? 'No pudimos traer los deudores'
                  : lista.buscando
                    ? 'Nadie coincide'
                    : 'Nadie te debe nada'
              }
              descripcion={
                !datos
                  ? (lista.error ?? 'Probá de nuevo en un rato.')
                  : lista.buscando
                    ? 'Probá con otro nombre o DNI.'
                    : 'La libreta está al día.'
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
            ) : !lista.hayMas && lista.deudores.length > 0 ? (
              <Text variant="caption" tone="muted" center style={styles.pie}>
                No hay más deudores.
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
