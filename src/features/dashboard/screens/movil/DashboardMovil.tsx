import { useRouter } from 'expo-router';
import {
  CalendarClock,
  CalendarDays,
  ChartColumn,
  CircleAlert,
  Plus,
  Receipt,
  TrendingUp,
  TriangleAlert,
  UserRoundX,
  Wallet,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, type DimensionValue } from 'react-native';

import { GraficoBarras, RenglonCliente, type PuntoGrafico } from '@/features/metricas/components';
import { mesCorto, mesLargo } from '@/features/metricas/formato';
import { useBreakpoint, useRefrescar } from '@/shared/hooks';
import { Button, EstadoVacio, Pantalla, Text } from '@/shared/ui/atoms';
import {
  contar,
  formatearCumplimiento,
  formatearMoneda,
  haceDias,
  textoDias,
} from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { FilaActividad, FilaCobranza, TarjetaResumen, Variacion } from '../../components';
import { useDashboard } from '../../hooks';

/** `12.5` -> `"12,5 %"`. La variacion del mes viene en porcentaje. */
const PORCENTAJE = new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1 });
const textoPorcentaje = (valor: number) =>
  `${valor > 0 ? '+' : ''}${PORCENTAJE.format(valor / 100)} que el mes pasado`;

/**
 * Inicio: lo primero que ve el administrador al entrar.
 *
 * Responde tres preguntas, en ese orden: a quien le cobro, como viene el mes y
 * que paso ultimo. Arriba lo accionable, en el medio los numeros y abajo el
 * contexto. Todo sale de una sola llamada (`GET /metricas/resumen`).
 *
 * No hay tarjeta de "hoy" a proposito: este negocio hace unos pocos tickets por
 * semana, y un "$0 hoy" casi todos los dias se lee como que la app esta rota.
 */
export function DashboardMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { elegir } = useBreakpoint();
  const dashboard = useDashboard();
  const refresco = useRefrescar(dashboard.refrescar);

  // Una tarjeta por fila en telefono; tres cuando hay lugar.
  const anchoTarjeta = elegir<DimensionValue>({ sm: '100%', md: '48%', lg: '32%' });
  const tamanoIcono = theme.typography.size.body;

  const { resumen } = dashboard;

  /*
   * Morosos, el historial y el perfil viven en el tab "Mas"; la factura y los
   * clientes, en los suyos. `withAnchor` deja la pantalla base de ese tab
   * debajo: sin eso el tab queda con una pantalla suelta y "atras" cae aca.
   */
  const irAMorosos = () => router.push('/admin/cuenta/metricas/morosos', { withAnchor: true });
  const irALaFactura = (id: string) => router.push(`/admin/facturas/${id}`, { withAnchor: true });
  const irAlHistorial = (id: string) =>
    router.push(
      { pathname: '/admin/cuenta/metricas/cliente/[id]', params: { id, volver: 'Inicio' } },
      { withAnchor: true },
    );
  const irAlPerfil = (id: string) =>
    router.push(
      { pathname: '/admin/cuenta/metricas/cliente/[id]/perfil', params: { id, volver: 'Inicio' } },
      { withAnchor: true },
    );
  const irAClientes = () => router.push('/admin/clientes');
  const irANuevoCliente = () => router.push('/admin/clientes/nuevo');

  /** La curva de la plata en la calle, un punto por mes. */
  const curva: PuntoGrafico[] = useMemo(
    () =>
      (resumen?.negocio.deuda.porMes ?? []).map((mes) => ({
        clave: mes.mes,
        etiqueta: mesCorto(mes.mes),
        valor: mes.deudaTotal,
        descripcion: `${mesLargo(mes.mes)}: ${formatearMoneda(mes.deudaTotal)} en la calle · ${formatearMoneda(mes.deudaVencida)} vencidos · ${contar(mes.deudores, 'deudor', 'deudores')}`,
      })),
    [resumen],
  );

  if (dashboard.cargando && !refresco.refrescando) {
    return (
      <Pantalla titulo="Inicio" descripcion="Cómo viene el negocio.">
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  if (!resumen) {
    return (
      <Pantalla titulo="Inicio" descripcion="Cómo viene el negocio.">
        <EstadoVacio
          icono={
            <ChartColumn size={theme.typography.size.heading} color={theme.colors.textMuted} />
          }
          titulo="No pudimos traer el resumen"
          descripcion={dashboard.error ?? 'Probá de nuevo en un rato.'}
          accion={<Button label="Reintentar" variant="secondary" onPress={dashboard.reintentar} />}
        />
      </Pantalla>
    );
  }

  const { cobranza, negocio, masVendido, mejoresClientes, actividad } = resumen;
  const { vencido, porVencer, seFueronDebiendo, pasaronElLimite } = cobranza;
  const hayQueHacer =
    vencido.clientes > 0 ||
    porVencer.clientes > 0 ||
    seFueronDebiendo.clientes > 0 ||
    pasaronElLimite.clientes > 0;

  /** "Camila Torres hace 93 días": el peor de la lista, para saber por dónde empezar. */
  const peorVencido = vencido.top[0];
  const primeroPorVencer = porVencer.top[0];
  const peorAusente = seFueronDebiendo.top[0];
  const peorExcedido = pasaronElLimite.top[0];

  return (
    <Pantalla titulo="Inicio" descripcion="Cómo viene el negocio.">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <View style={styles.seccion}>
          <Text variant="title" weight="bold" accessibilityRole="header">
            Qué hay que hacer
          </Text>

          {/* Cada tarjeta se esconde cuando no hay nadie en ese estado. */}
          {vencido.clientes > 0 ? (
            <FilaCobranza
              icono={<CircleAlert size={16} color={theme.colors.error} />}
              etiqueta="A cobrar"
              valor={formatearMoneda(vencido.monto)}
              detalle={[
                contar(vencido.clientes, 'cliente', 'clientes'),
                peorVencido?.cliente
                  ? `el más atrasado: ${peorVencido.cliente.nombre}, ${textoDias(peorVencido.dias)}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              tono="error"
              onPress={irAMorosos}
            />
          ) : null}

          {porVencer.clientes > 0 ? (
            <FilaCobranza
              icono={<CalendarClock size={16} color={theme.colors.warning} />}
              etiqueta={`Vence en ${textoDias(porVencer.dias)}`}
              valor={formatearMoneda(porVencer.monto)}
              detalle={[
                contar(porVencer.clientes, 'cliente', 'clientes'),
                primeroPorVencer?.cliente
                  ? `el primero: ${primeroPorVencer.cliente.nombre}`
                  : 'avisales antes de que se atrasen',
              ]
                .filter(Boolean)
                .join(' · ')}
              tono="warning"
              onPress={() =>
                primeroPorVencer ? irALaFactura(primeroPorVencer.factura) : irAMorosos()
              }
            />
          ) : null}

          {seFueronDebiendo.clientes > 0 ? (
            <FilaCobranza
              icono={<UserRoundX size={16} color={theme.colors.error} />}
              etiqueta="Se fueron debiendo"
              valor={formatearMoneda(seFueronDebiendo.monto)}
              detalle={[
                `${contar(seFueronDebiendo.clientes, 'cliente', 'clientes')} sin comprar hace más de ${textoDias(seFueronDebiendo.dias)}`,
                peorAusente?.cliente
                  ? `${peorAusente.cliente.nombre}, ${peorAusente.diasSinComprar === null ? 'nunca compró' : `última compra ${haceDias(peorAusente.diasSinComprar)}`}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              tono="error"
              onPress={() =>
                peorAusente?.cliente ? irAlHistorial(peorAusente.cliente.id) : irAMorosos()
              }
            />
          ) : null}

          {pasaronElLimite.clientes > 0 ? (
            <FilaCobranza
              icono={<TriangleAlert size={16} color={theme.colors.warning} />}
              etiqueta="Pasaron su límite"
              valor={formatearMoneda(pasaronElLimite.monto)}
              detalle={
                peorExcedido?.cliente
                  ? `${peorExcedido.cliente.nombre} debe ${formatearMoneda(peorExcedido.excedido)} más que su límite`
                  : contar(pasaronElLimite.clientes, 'cliente', 'clientes')
              }
              tono="warning"
              onPress={() =>
                peorExcedido?.cliente ? irAlPerfil(peorExcedido.cliente.id) : irAMorosos()
              }
            />
          ) : null}

          {hayQueHacer ? null : (
            <Text variant="body" tone="muted">
              Nada pendiente: no hay vencidos, ni clientes que se hayan ido debiendo, ni nadie
              pasado de su límite.
            </Text>
          )}
        </View>

        <View style={styles.seccion}>
          <Text variant="title" weight="bold" accessibilityRole="header">
            Cómo viene el mes
          </Text>
          <View style={styles.grilla}>
            <View style={{ width: anchoTarjeta }}>
              <TarjetaResumen
                etiqueta="Vendiste este mes"
                valor={formatearMoneda(negocio.mes.vendido)}
                detalle={`${contar(negocio.mes.tickets, 'ticket', 'tickets')} · ${contar(negocio.mes.clientes, 'cliente', 'clientes')}`}
                icono={<TrendingUp size={tamanoIcono} color={theme.colors.textMuted} />}
              >
                <Variacion valor={negocio.variacion.vendido} texto={textoPorcentaje} />
              </TarjetaResumen>
            </View>
            <View style={{ width: anchoTarjeta }}>
              <TarjetaResumen
                etiqueta="Cobraste este mes"
                valor={formatearMoneda(negocio.mes.cobrado)}
                detalle={`Fiaste ${formatearMoneda(negocio.mes.fiado)}`}
                icono={<Wallet size={tamanoIcono} color={theme.colors.textMuted} />}
              >
                <Variacion valor={negocio.variacion.cobrado} texto={textoPorcentaje} />
              </TarjetaResumen>
            </View>
            <View style={{ width: anchoTarjeta }}>
              <TarjetaResumen
                etiqueta={`Últimos ${textoDias(negocio.semana.dias)}`}
                valor={formatearMoneda(negocio.semana.vendido)}
                detalle={`${contar(negocio.semana.tickets, 'ticket', 'tickets')} · cobraste ${formatearMoneda(negocio.semana.cobrado)}`}
                icono={<CalendarDays size={tamanoIcono} color={theme.colors.textMuted} />}
              />
            </View>
          </View>
          <Text variant="caption" tone="muted">
            La comparación es contra el mismo tramo del mes pasado, no contra el mes entero.
          </Text>
        </View>

        <View style={styles.seccion}>
          <Text variant="title" weight="bold" accessibilityRole="header">
            En la calle
          </Text>
          <TarjetaResumen
            etiqueta="Lo que te deben hoy"
            valor={formatearMoneda(negocio.deuda.total)}
            detalle={`${formatearMoneda(negocio.deuda.vencida)} ya vencido`}
            icono={<ChartColumn size={tamanoIcono} color={theme.colors.textMuted} />}
          >
            <Variacion
              valor={negocio.deuda.variacion}
              subirEsBueno={false}
              texto={(valor) =>
                valor > 0
                  ? `La libreta creció ${formatearMoneda(valor)}`
                  : `La libreta se achicó ${formatearMoneda(Math.abs(valor))}`
              }
            />
            {curva.length > 0 ? <GraficoBarras puntos={curva} tono="primary" /> : null}
          </TarjetaResumen>
        </View>

        <View style={styles.seccion}>
          <Text variant="title" weight="bold" accessibilityRole="header">
            Atajos
          </Text>
          <View style={styles.atajos}>
            <Button
              label="Cargar ticket"
              onPress={irAClientes}
              leftIcon={<Receipt size={16} color={theme.colors.onPrimary} />}
              style={styles.atajo}
            />
            <Button
              label="Registrar pago"
              variant="secondary"
              onPress={irAClientes}
              leftIcon={<Wallet size={16} color={theme.colors.primary} />}
              style={styles.atajo}
            />
          </View>
          <Button
            label="Nuevo cliente"
            variant="ghost"
            onPress={irANuevoCliente}
            leftIcon={<Plus size={16} color={theme.colors.primary} />}
            fullWidth
          />
          <Text variant="caption" tone="muted">
            Cargar y cobrar arrancan eligiendo al cliente.
          </Text>
        </View>

        {masVendido.length > 0 ? (
          <View style={styles.seccion}>
            <Text variant="title" weight="bold" accessibilityRole="header">
              Lo más vendido del mes
            </Text>
            {masVendido.map((especie, indice) => (
              <View
                key={especie.especie.id ?? `sin-especie-${indice}`}
                style={styles.especie}
                accessible
                accessibilityLabel={`${especie.especie.nombre}: ${formatearMoneda(especie.monto)}, ${contar(especie.unidades, 'unidad', 'unidades')}`}
              >
                <Text variant="body" numberOfLines={1} style={styles.nombre}>
                  {especie.especie.nombre}
                </Text>
                <Text variant="caption" tone="muted">
                  {contar(especie.unidades, 'u.', 'u.')}
                </Text>
                <Text variant="body" weight="bold" family="text">
                  {formatearMoneda(especie.monto)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {mejoresClientes.length > 0 ? (
          <View style={styles.seccion}>
            <Text variant="title" weight="bold" accessibilityRole="header">
              Mejores clientes
            </Text>
            {mejoresClientes.map((mejor) => (
              <RenglonCliente
                key={mejor.cliente?.id ?? `sin-cliente-${mejor.posicion}`}
                cliente={mejor.cliente}
                posicion={mejor.posicion}
                lineas={[`Te compró ${formatearMoneda(mejor.comprado)}`]}
                valor={formatearCumplimiento(mejor.cumplimiento)}
                detalleValor={contar(mejor.evaluadas, 'factura', 'facturas')}
                onPress={irAlPerfil}
              />
            ))}
          </View>
        ) : null}

        {actividad.length > 0 ? (
          <View style={styles.seccion}>
            <Text variant="title" weight="bold" accessibilityRole="header">
              Última actividad
            </Text>
            {actividad.map((movimiento) => (
              <FilaActividad key={`${movimiento.tipo}-${movimiento.id}`} actividad={movimiento} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.lg, paddingBottom: theme.spacing.lg },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    seccion: { gap: theme.spacing.sm },
    grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
    atajos: { flexDirection: 'row', gap: theme.spacing.sm },
    atajo: { flex: 1 },
    especie: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    // `flex: 1` para que un nombre largo se recorte en vez de empujar el monto.
    nombre: { flex: 1 },
  });
