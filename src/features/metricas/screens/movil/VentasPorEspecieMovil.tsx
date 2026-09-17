import { useRouter } from 'expo-router';
import { Tags } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { EstadoVacio, Pantalla, Text } from '@/shared/ui/atoms';
import { formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import {
  BarraProporcion,
  CifraDestacada,
  EstadoMetrica,
  Pestanas,
  SelectorPeriodo,
} from '../../components';
import { contar, formatearPorcentaje } from '../../formato';
import { MEDIDAS_ESPECIES, useNavegarMetricas, useVentasPorEspecie } from '../../hooks';

/**
 * Ventas por especie: que se vende mas. El total del periodo arriba, y una
 * barra por especie, en cantidad o en plata segun el selector. Tocar una abre
 * su detalle con el mismo periodo.
 */
export function VentasPorEspecieMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const ventas = useVentasPorEspecie();
  const refresco = useRefrescar(ventas.refrescar);
  const { irALaEspecie } = useNavegarMetricas();

  const { datos } = ventas;
  const enPlata = ventas.orden === 'monto';
  const masVendida = datos?.resumen.masVendida;

  // Las barras van contra la primera del ranking: la de arriba se ve llena y las
  // demas se comparan con ella. El porcentaje del total va escrito al lado.
  const maximo = Math.max(
    1,
    ...(datos?.especies ?? []).map((e) => (enPlata ? e.monto : e.unidades)),
  );

  return (
    <Pantalla
      titulo="Ventas por especie"
      descripcion="Cuánto se vende de qué."
      ancho="contenido"
      onVolver={() => router.back()}
      labelVolver="Métricas"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <SelectorPeriodo
          activo={ventas.periodo}
          onCambiar={ventas.setPeriodo}
          periodo={datos?.periodo}
          actualizando={ventas.actualizando && !refresco.refrescando}
        />
        <Pestanas opciones={MEDIDAS_ESPECIES} activa={ventas.orden} onCambiar={ventas.setOrden} />

        <EstadoMetrica
          cargando={ventas.cargando && !refresco.refrescando}
          error={ventas.error}
          hayDatos={datos !== undefined}
          onReintentar={ventas.reintentar}
          tituloError="No pudimos traer las ventas"
          icono={<Tags size={theme.typography.size.heading} color={theme.colors.textMuted} />}
        >
          {datos ? (
            masVendida ? (
              <>
                <CifraDestacada
                  etiqueta="Vendido en el período"
                  valor={
                    enPlata
                      ? formatearMoneda(datos.resumen.monto)
                      : contar(datos.resumen.unidades, 'unidad', 'unidades')
                  }
                  detalle={`${
                    enPlata
                      ? contar(datos.resumen.unidades, 'unidad', 'unidades')
                      : formatearMoneda(datos.resumen.monto)
                  } · ${contar(datos.resumen.especies, 'especie', 'especies')}`}
                >
                  <Text variant="body">
                    La más vendida: <Text weight="bold">{masVendida.nombre}</Text>
                    {` (${
                      enPlata
                        ? formatearMoneda(masVendida.monto)
                        : contar(masVendida.unidades, 'unidad', 'unidades')
                    })`}
                  </Text>
                </CifraDestacada>

                <View
                  style={[
                    styles.especies,
                    ventas.actualizando && !refresco.refrescando && styles.actualizando,
                  ]}
                >
                  {datos.especies.map((e) => {
                    const porcentaje = enPlata ? e.porcentajeMonto : e.porcentajeUnidades;
                    const { id } = e.especie;

                    return (
                      <BarraProporcion
                        key={id ?? `sin-especie-${e.posicion}`}
                        etiqueta={`${e.posicion}. ${e.especie.nombre}`}
                        valor={enPlata ? formatearMoneda(e.monto) : contar(e.unidades, 'u.', 'u.')}
                        detalle={`${
                          enPlata
                            ? contar(e.unidades, 'unidad', 'unidades')
                            : formatearMoneda(e.monto)
                        } · ${formatearPorcentaje(porcentaje)} del total`}
                        proporcion={(enPlata ? e.monto : e.unidades) / maximo}
                        // Sin especie (items viejos) no hay detalle que abrir.
                        tono={id ? 'primary' : 'neutral'}
                        onPress={id ? () => irALaEspecie(id, ventas.periodo) : undefined}
                        abre
                      />
                    );
                  })}
                </View>

                <Text variant="caption" tone="muted">
                  Tocá una especie para ver sus talles y sus artículos.
                </Text>
              </>
            ) : (
              <EstadoVacio
                icono={<Tags size={theme.typography.size.heading} color={theme.colors.textMuted} />}
                titulo="Sin ventas en el período"
                descripcion="Probá con un período más largo."
              />
            )
          ) : null}
        </EstadoMetrica>
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.md, paddingBottom: theme.spacing.lg },
    especies: { gap: theme.spacing.sm },
    actualizando: { opacity: 0.5 },
  });
