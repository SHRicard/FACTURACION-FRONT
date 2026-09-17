import { useLocalSearchParams, useRouter } from 'expo-router';
import { Tags } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { Pantalla, Text } from '@/shared/ui/atoms';
import { formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import {
  BarraProporcion,
  CifraDestacada,
  DatoChico,
  EstadoMetrica,
  GraficoBarras,
  SelectorPeriodo,
  type PuntoGrafico,
} from '../../components';
import {
  contar,
  formatearCantidad,
  formatearPorcentaje,
  mesCorto,
  textoMesEspecie,
} from '../../formato';
import { useDetalleEspecie } from '../../hooks';
import { esClavePeriodo } from '../../periodo';

/**
 * El detalle de una especie: cuanto vendio, mes a mes, y que talles y que
 * articulos salen mas. Se abre desde el ranking, con el mismo periodo.
 */
export function DetalleEspecieMovil() {
  const params = useLocalSearchParams<{ especie: string; periodo?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const detalle = useDetalleEspecie(
    params.especie,
    esClavePeriodo(params.periodo) ? params.periodo : undefined,
  );
  const refresco = useRefrescar(detalle.refrescar);

  const { datos, mesElegido } = detalle;

  const puntos: PuntoGrafico[] = useMemo(
    () =>
      (datos?.porMes ?? []).map((mes) => ({
        clave: mes.mes,
        etiqueta: mesCorto(mes.mes),
        valor: mes.unidades,
        descripcion: textoMesEspecie(mes),
      })),
    [datos],
  );

  // Las barras van contra la primera de cada lista, que es la que mas vendio:
  // asi la de arriba se ve llena y las demas se comparan con ella.
  const maximoTalles = Math.max(1, ...(datos?.talles ?? []).map((talle) => talle.unidades));
  const maximoArticulos = Math.max(1, ...(datos?.articulos ?? []).map((a) => a.unidades));

  return (
    <Pantalla
      titulo={datos?.especie.nombre ?? 'Especie'}
      descripcion="Qué talles y qué artículos salen más."
      ancho="contenido"
      onVolver={() => router.back()}
      labelVolver="Ventas"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <SelectorPeriodo
          activo={detalle.periodo}
          onCambiar={detalle.setPeriodo}
          periodo={datos?.periodo}
          actualizando={detalle.actualizando && !refresco.refrescando}
        />

        <EstadoMetrica
          cargando={detalle.cargando && !refresco.refrescando}
          error={detalle.error}
          hayDatos={datos !== undefined}
          onReintentar={detalle.reintentar}
          tituloError={detalle.noExiste ? 'Esa especie no existe' : 'No pudimos traer la especie'}
          icono={<Tags size={theme.typography.size.heading} color={theme.colors.textMuted} />}
        >
          {datos ? (
            <>
              <CifraDestacada
                etiqueta="Vendido en el período"
                valor={contar(datos.resumen.unidades, 'unidad', 'unidades')}
                detalle={`${formatearMoneda(datos.resumen.monto)} · ${formatearPorcentaje(datos.resumen.porcentajeUnidades)} de todo lo vendido`}
              />

              <View style={styles.datos}>
                <DatoChico
                  etiqueta="De la plata"
                  valor={formatearPorcentaje(datos.resumen.porcentajeMonto)}
                  detalle="Del total del período"
                />
                <DatoChico
                  etiqueta="Tickets"
                  valor={formatearCantidad(datos.resumen.tickets)}
                  detalle="En los que apareció"
                />
              </View>

              <View style={styles.seccion}>
                <Text variant="title" weight="bold" accessibilityRole="header">
                  Mes a mes
                </Text>
                <GraficoBarras
                  puntos={puntos}
                  tono="primary"
                  elegida={mesElegido?.mes ?? null}
                  onElegir={detalle.elegirMes}
                />
                {mesElegido ? (
                  <Text variant="caption" tone="muted" accessibilityLiveRegion="polite">
                    {textoMesEspecie(mesElegido)}
                  </Text>
                ) : null}
              </View>

              <View style={styles.seccion}>
                <Text variant="title" weight="bold" accessibilityRole="header">
                  Talles
                </Text>
                <Text variant="caption" tone="muted">
                  Los que más salen: sirve para saber qué reponer.
                </Text>
                {datos.talles.length > 0 ? (
                  datos.talles.map((talle) => (
                    <BarraProporcion
                      key={talle.talle ?? 'sin-talle'}
                      etiqueta={talle.talle ?? 'Sin talle'}
                      valor={contar(talle.unidades, 'u.', 'u.')}
                      detalle={`${formatearMoneda(talle.monto)} · ${formatearPorcentaje(talle.porcentaje)} de la especie`}
                      proporcion={talle.unidades / maximoTalles}
                      tono={talle.talle ? 'primary' : 'neutral'}
                    />
                  ))
                ) : (
                  <Text variant="body" tone="muted">
                    No se vendió nada en el período.
                  </Text>
                )}
              </View>

              <View style={styles.seccion}>
                <Text variant="title" weight="bold" accessibilityRole="header">
                  Artículos
                </Text>
                <Text variant="caption" tone="muted">
                  Como se escribieron en el ticket: si una vez dice &quot;Media rayada&quot; y otra
                  &quot;Media a rayas&quot;, salen separados.
                </Text>
                {datos.articulos.length > 0 ? (
                  datos.articulos.map((articulo, indice) => (
                    <BarraProporcion
                      // Se agrupan sin mayusculas: el nombre solo no alcanza de clave.
                      key={`${articulo.nombre}-${indice}`}
                      etiqueta={articulo.nombre}
                      valor={contar(articulo.unidades, 'u.', 'u.')}
                      detalle={`${formatearMoneda(articulo.monto)} · ${formatearPorcentaje(articulo.porcentaje)} de la especie`}
                      proporcion={articulo.unidades / maximoArticulos}
                      tono="primary"
                    />
                  ))
                ) : (
                  <Text variant="body" tone="muted">
                    No se vendió nada en el período.
                  </Text>
                )}
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
    seccion: { gap: theme.spacing.sm },
  });
