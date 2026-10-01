import { useRouter } from 'expo-router';
import { Trophy } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { Badge, EstadoVacio, Pantalla } from '@/shared/ui/atoms';
import { formatearMoneda, tonoCumplimiento } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { EstadoMetrica, Pestanas, RenglonCliente, SelectorPeriodo } from '../../components';
import { contar, formatearPorcentaje } from '../../formato';
import { PESTANAS_MEJORES, useMejoresClientes, useNavegarMetricas } from '../../hooks';
import type { Cumplimiento, MejorCliente } from '../../types';

/** Sin ninguna factura para juzgar no pago mal: todavia no hubo nada que pagar. */
const sinHistorial = (c: Cumplimiento): boolean =>
  c.evaluadas === 0 || c.cumplimientoPromedio === null;

function textoCumplimiento(c: Cumplimiento): string {
  return sinHistorial(c)
    ? 'Sin historial'
    : `${formatearPorcentaje(c.cumplimientoPromedio)} de cumplimiento`;
}

/**
 * Mejores clientes: dos rankings sobre la misma lista, porque el que mas se
 * lleva puede ser el que peor paga. El que manda es el cumplimiento.
 */
export function MejoresClientesMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const ranking = useMejoresClientes();
  const refresco = useRefrescar(ranking.refrescar);
  const { irAlPerfil } = useNavegarMetricas();

  // Tocar un cliente abre su perfil: por que es buen cliente y cuanto vale.
  const verPerfil = (id: string) => irAlPerfil(id, 'Mejores');

  const { datos } = ranking;
  const porCumplimiento = ranking.orden === 'cumplimiento';

  const renglon = (item: MejorCliente) => (
    <RenglonCliente
      key={item.cliente?.id ?? `sin-cliente-${item.posicion}`}
      cliente={item.cliente}
      posicion={item.posicion}
      lineas={[
        porCumplimiento
          ? `Compró ${formatearMoneda(item.comprado)} en ${contar(item.tickets, 'ticket', 'tickets')}`
          : `${contar(item.tickets, 'ticket', 'tickets')} · promedio ${item.ticketPromedio === null ? '—' : formatearMoneda(item.ticketPromedio)}`,
        `${formatearPorcentaje(item.porcentajeFiado)} fiado · hoy debe ${formatearMoneda(item.saldo)}`,
      ]}
      valor={
        porCumplimiento
          ? formatearPorcentaje(item.cumplimiento.cumplimientoPromedio)
          : formatearMoneda(item.comprado)
      }
      detalleValor={
        porCumplimiento
          ? sinHistorial(item.cumplimiento)
            ? 'sin historial'
            : contar(item.cumplimiento.evaluadas, 'factura', 'facturas')
          : 'comprado'
      }
      avisos={
        <Badge
          label={textoCumplimiento(item.cumplimiento)}
          tone={tonoCumplimiento(
            sinHistorial(item.cumplimiento) ? null : item.cumplimiento.cumplimientoPromedio,
          )}
        />
      }
      onPress={verPerfil}
    />
  );

  return (
    <Pantalla
      titulo="Mejores clientes"
      descripcion="A quién cuidar, y a quién se le puede subir el límite."
      onVolver={() => router.back()}
      labelVolver="Métricas"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <SelectorPeriodo
          activo={ranking.periodo}
          onCambiar={ranking.setPeriodo}
          // `null` = toda la historia: no hay rango que mostrar.
          periodo={datos?.periodo ?? undefined}
          actualizando={ranking.actualizando && !refresco.refrescando}
        />
        <Pestanas opciones={PESTANAS_MEJORES} activa={ranking.orden} onCambiar={ranking.setOrden} />

        <EstadoMetrica
          cargando={ranking.cargando && !refresco.refrescando}
          error={ranking.error}
          hayDatos={datos !== undefined}
          onReintentar={ranking.reintentar}
          tituloError="No pudimos traer el ranking"
          icono={<Trophy size={theme.typography.size.heading} color={theme.colors.textMuted} />}
        >
          {datos ? (
            datos.clientes.length > 0 ? (
              <View
                style={[
                  styles.lista,
                  ranking.actualizando && !refresco.refrescando && styles.actualizando,
                ]}
              >
                {datos.clientes.map(renglon)}
              </View>
            ) : (
              <EstadoVacio
                icono={
                  <Trophy size={theme.typography.size.heading} color={theme.colors.textMuted} />
                }
                titulo={
                  porCumplimiento
                    ? 'Ninguna factura para juzgar en este período'
                    : 'Nadie compró en este período'
                }
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
    lista: { gap: theme.spacing.sm },
    actualizando: { opacity: 0.5 },
  });
