import { useRouter } from 'expo-router';
import { CalendarCheck } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { Pantalla, Text } from '@/shared/ui/atoms';
import { formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import {
  BarraApilada,
  CifraDestacada,
  DatoChico,
  EstadoMetrica,
  SelectorPeriodo,
  type Segmento,
} from '../../components';
import { contar, formatearPorcentaje, mesLargo, textoDias } from '../../formato';
import { usePagosATiempo } from '../../hooks';
import type { Cumplimiento } from '../../types';

/** Los tres resultados, en el orden en que se leen: de lo bueno a lo malo. */
function segmentosDe(c: Cumplimiento): Segmento[] {
  return [
    { clave: 'a-tiempo', etiqueta: 'A tiempo', valor: c.aTiempo, tono: 'success' },
    { clave: 'tarde', etiqueta: 'Tarde', valor: c.tarde, tono: 'warning' },
    { clave: 'impagas', etiqueta: 'Impagas', valor: c.impagas, tono: 'error' },
  ];
}

/**
 * Pagos a tiempo: que tan bien paga la clientela. El numero grande es el
 * cumplimiento promedio —cada peso pagado tarde pierde un poco por dia de
 * atraso—; la barra parte las facturas en a tiempo / tarde / impagas, y la
 * evolucion por mes va debajo.
 */
export function PagosATiempoMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const pagos = usePagosATiempo();
  const refresco = useRefrescar(pagos.refrescar);

  const { datos } = pagos;
  // El mes mas reciente arriba: es el que se viene a mirar.
  const meses = datos ? [...datos.porMes].reverse() : [];

  return (
    <Pantalla titulo="Pagos a tiempo" onVolver={() => router.back()} labelVolver="Métricas">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <SelectorPeriodo
          activo={pagos.periodo}
          onCambiar={pagos.setPeriodo}
          periodo={datos?.periodo}
          // El periodo es el de VENCIMIENTO: sin decirlo, se lee como el de pago.
          nota="Facturas que vencían del"
          actualizando={pagos.actualizando && !refresco.refrescando}
        />

        <EstadoMetrica
          cargando={pagos.cargando && !refresco.refrescando}
          error={pagos.error}
          hayDatos={datos !== undefined}
          onReintentar={pagos.reintentar}
          tituloError="No pudimos traer los pagos a tiempo"
          icono={
            <CalendarCheck size={theme.typography.size.heading} color={theme.colors.textMuted} />
          }
        >
          {datos ? (
            <>
              <CifraDestacada
                etiqueta="Cumplimiento promedio"
                valor={formatearPorcentaje(datos.resumen.cumplimientoPromedio)}
                detalle={
                  datos.resumen.evaluadas > 0
                    ? `De ${contar(datos.resumen.evaluadas, 'factura que ya se puede juzgar', 'facturas que ya se pueden juzgar')}.`
                    : 'Ninguna factura con algo fiado venció en este período.'
                }
              >
                <BarraApilada segmentos={segmentosDe(datos.resumen)} conLeyenda />
              </CifraDestacada>

              <View style={styles.datos}>
                <DatoChico
                  etiqueta="Pagadas a tiempo"
                  valor={formatearPorcentaje(datos.resumen.porcentajeATiempo)}
                  detalle="Saldadas al 100%"
                />
                <DatoChico
                  etiqueta="Atraso promedio"
                  valor={
                    datos.resumen.diasPromedioDeAtraso === null
                      ? '—'
                      : textoDias(datos.resumen.diasPromedioDeAtraso)
                  }
                  detalle="De las que se pagaron tarde"
                />
                <DatoChico
                  etiqueta="Todavía impago"
                  valor={formatearMoneda(datos.resumen.saldoImpago)}
                  tono={datos.resumen.saldoImpago > 0 ? 'error' : 'default'}
                  detalle={contar(datos.resumen.impagas, 'factura vencida', 'facturas vencidas')}
                />
              </View>

              <Text variant="caption" tone="muted">
                No cuentan las que todavía no vencieron ni las que se pagaron enteras al comprar: no
                hubo nada que pagar a tiempo. Se mide contra el vencimiento original: cambiarle la
                fecha a una factura no le borra el atraso.
              </Text>

              <View style={styles.seccion}>
                <Text variant="title" weight="bold" accessibilityRole="header">
                  Mes por mes
                </Text>
                {meses.map((mes) => (
                  <View key={mes.mes} style={styles.mes}>
                    <View style={styles.encabezadoMes}>
                      <Text variant="body" weight="medium" style={styles.nombreMes}>
                        {mesLargo(mes.mes)}
                      </Text>
                      <Text variant="body" weight="bold" family="text">
                        {formatearPorcentaje(mes.cumplimientoPromedio)}
                      </Text>
                    </View>
                    {mes.evaluadas > 0 ? (
                      <>
                        <BarraApilada segmentos={segmentosDe(mes)} grosor="fina" />
                        <Text variant="caption" tone="muted">
                          {`${mes.aTiempo} a tiempo · ${mes.tarde} tarde · ${mes.impagas} impagas`}
                        </Text>
                      </>
                    ) : (
                      <Text variant="caption" tone="muted">
                        No venció ninguna factura para evaluar.
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </EstadoMetrica>
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.lg, paddingBottom: theme.spacing.lg },
    datos: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    seccion: { gap: theme.spacing.md },
    mes: {
      gap: theme.spacing.xs,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    encabezadoMes: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    nombreMes: { flex: 1 },
  });
