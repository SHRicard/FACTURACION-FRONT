import { useRouter } from 'expo-router';
import { Percent } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { Pantalla, Text, type TextTone } from '@/shared/ui/atoms';
import { formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import {
  BarrasPorMes,
  CifraDestacada,
  DatoChico,
  EstadoMetrica,
  SelectorPeriodo,
} from '../../components';
import { formatearPorcentaje } from '../../formato';
import { useTasaCobranza } from '../../hooks';
import type { TasaCobranza } from '../../types';

/** La frase de abajo del numero: lo que la tasa le hizo a la libreta. */
function fraseDeLaLibreta(total: TasaCobranza['total']): { texto: string; tono: TextTone } {
  if (total.tasa === null) return { texto: 'No se fió nada en este período.', tono: 'muted' };
  if (total.variacionDeuda > 0) {
    return {
      texto: `La libreta creció ${formatearMoneda(total.variacionDeuda)}.`,
      tono: 'warning',
    };
  }
  if (total.variacionDeuda < 0) {
    return {
      texto: `La libreta se achicó ${formatearMoneda(-total.variacionDeuda)}.`,
      tono: 'success',
    };
  }
  return { texto: 'La libreta quedó igual: se cobró lo mismo que se fió.', tono: 'muted' };
}

/**
 * Tasa de cobranza: de lo que se fio, cuanto volvio en pagos. El numero grande
 * dice si la libreta crece o se achica; las barras, como vino cada mes.
 */
export function TasaCobranzaMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const tasa = useTasaCobranza();
  const refresco = useRefrescar(tasa.refrescar);

  const { datos } = tasa;
  const frase = datos ? fraseDeLaLibreta(datos.total) : null;

  return (
    <Pantalla titulo="Tasa de cobranza" onVolver={() => router.back()} labelVolver="Métricas">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <SelectorPeriodo
          activo={tasa.periodo}
          onCambiar={tasa.setPeriodo}
          periodo={datos?.periodo}
          actualizando={tasa.actualizando && !refresco.refrescando}
        />

        <EstadoMetrica
          cargando={tasa.cargando && !refresco.refrescando}
          error={tasa.error}
          hayDatos={datos !== undefined}
          onReintentar={tasa.reintentar}
          tituloError="No pudimos traer la tasa de cobranza"
          icono={<Percent size={theme.typography.size.heading} color={theme.colors.textMuted} />}
        >
          {datos && frase ? (
            <>
              <CifraDestacada
                etiqueta="Se cobró, de lo que se fió"
                valor={formatearPorcentaje(datos.total.tasa)}
                tono={datos.total.tasa !== null && datos.total.tasa >= 100 ? 'success' : 'default'}
                detalle={frase.texto}
                tonoDetalle={frase.tono}
              />

              {/* Pasar de 100 se lee como un error si nadie lo explica. */}
              {datos.total.tasa !== null && datos.total.tasa > 100 ? (
                <Text variant="caption" tone="muted">
                  Pasa de 100 % porque se cobró más de lo que se fió: esos pagos también cancelaron
                  deuda de antes. Es buena noticia.
                </Text>
              ) : null}

              <View style={styles.datos}>
                <DatoChico etiqueta="Fiado" valor={formatearMoneda(datos.total.fiado)} />
                <DatoChico
                  etiqueta="Cobrado"
                  valor={formatearMoneda(datos.total.cobrado)}
                  detalle="Pagos a cuenta"
                />
                <DatoChico etiqueta="Vendido" valor={formatearMoneda(datos.total.vendido)} />
                <DatoChico
                  etiqueta="Pagado al comprar"
                  valor={formatearMoneda(datos.total.dejadoAlComprar)}
                  detalle="No entra en la tasa: nunca se fió"
                />
              </View>

              <View style={styles.seccion}>
                <Text variant="title" weight="bold" accessibilityRole="header">
                  Mes por mes
                </Text>
                <BarrasPorMes
                  series={[
                    { etiqueta: 'Fiado', tono: 'warning' },
                    { etiqueta: 'Cobrado', tono: 'success' },
                  ]}
                  meses={datos.porMes.map((m) => ({
                    mes: m.mes,
                    valores: [m.fiado, m.cobrado] as const,
                  }))}
                  formatear={formatearMoneda}
                />
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
  });
