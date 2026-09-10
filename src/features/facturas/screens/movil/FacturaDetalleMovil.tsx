import { useLocalSearchParams, useRouter } from 'expo-router';
import { Receipt, Wallet } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { Badge, Button, EstadoVacio, Pantalla, Text } from '@/shared/ui/atoms';
import {
  formatearFecha,
  formatearFechaCorta,
  formatearMoneda,
  textoVencimiento,
  tonoEstadoFactura,
} from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { BloqueTicket, ResumenTotales } from '../../components';
import { useFacturaDetalle } from '../../hooks';

/**
 * La cuenta de un periodo: los tickets, los pagos y los cinco totales.
 *
 * Es la misma pantalla se llegue desde el listado de facturacion o desde la
 * ficha del cliente, porque `GET /clientes/:id/factura-actual` devuelve
 * exactamente la misma forma que `GET /facturas/:id`.
 */
export function FacturaDetalleMovil() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const ficha = useFacturaDetalle(id);
  const refresco = useRefrescar(ficha.refrescar);

  const volver = () => router.back();

  /*
   * El ticket se abre DENTRO del stack de Facturas, no en el de Clientes. Si
   * saltara de tab, el stack de Clientes quedaria con el ticket solo: "atras"
   * caeria en el Dashboard y el tab de Clientes quedaria trabado en ese ticket.
   * El cliente viaja como parametro aparte porque aca `id` es la factura.
   */
  const irAlTicket = useCallback(
    (ticketId: string) => {
      if (!ficha.detalle) return;
      router.push({
        pathname: '/admin/facturas/[id]/tickets/[ticketId]',
        params: { id, ticketId, clienteId: ficha.detalle.cliente.id },
      });
    },
    [router, ficha.detalle, id],
  );

  if (ficha.cargando && !refresco.refrescando) {
    return (
      <Pantalla titulo="Factura" ancho="contenido" onVolver={volver} labelVolver="Facturación">
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  if (!ficha.detalle) {
    return (
      <Pantalla titulo="Factura" ancho="contenido" onVolver={volver} labelVolver="Facturación">
        <EstadoVacio
          titulo={ficha.noExiste ? 'Esa factura no existe' : 'No pudimos traer la factura'}
          descripcion={
            ficha.noExiste
              ? 'Puede que sea de otro negocio, o que el link esté mal.'
              : (ficha.error ?? undefined)
          }
          accion={
            ficha.noExiste ? (
              <Button label="Volver" variant="secondary" onPress={volver} />
            ) : (
              <Button label="Reintentar" variant="secondary" onPress={ficha.reintentar} />
            )
          }
        />
      </Pantalla>
    );
  }

  const { cliente, factura, tickets, pagos } = ficha.detalle;

  /*
   * El numero se asigna al CERRAR: una factura abierta no tiene, y la clave ni
   * siquiera viene en el JSON.
   */
  const periodo = factura.numero
    ? `N° ${String(factura.numero).padStart(4, '0')}`
    : 'Período en curso';

  // Los tickets solo se corrigen mientras la factura sigue abierta; despues
  // queda congelada, asi que los bloques dejan de ser tocables.
  const abierta = factura.estado === 'abierta';

  return (
    <Pantalla
      titulo={cliente.nombre}
      descripcion={`DNI ${cliente.dni}`}
      ancho="contenido"
      onVolver={volver}
      labelVolver="Facturación"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <View style={[styles.cabecera, factura.vencida && styles.vencida]}>
          <View style={styles.filaEstado}>
            <Text variant="body" weight="medium">
              {periodo}
            </Text>
            {/* El chip sale de `estadoVisible`, NUNCA de `estado`. */}
            <Badge label={factura.estadoVisible} tone={tonoEstadoFactura(factura.estadoVisible)} />
          </View>
          <Text variant="caption" tone={factura.vencida ? 'error' : 'muted'}>
            {textoVencimiento(factura.diasParaVencer)} · vence el{' '}
            {formatearFecha(factura.venceEl) ?? 'sin fecha'}
          </Text>
        </View>

        <ResumenTotales factura={factura} />

        <View style={styles.seccion}>
          <Text variant="title" weight="bold" accessibilityRole="header">
            Tickets
          </Text>

          {tickets.length === 0 ? (
            <Text variant="body" tone="muted">
              Todavía no se llevó nada este período.
            </Text>
          ) : (
            tickets.map((ticket) => (
              <BloqueTicket
                key={ticket.id}
                ticket={ticket}
                onPress={abierta ? irAlTicket : undefined}
              />
            ))
          )}
        </View>

        {/* Los pagos a cuenta van aparte de lo que deja en cada ticket: son dos
            formas distintas de bajar la deuda y se leen por separado. */}
        {pagos.length > 0 ? (
          <View style={styles.seccion}>
            <Text variant="title" weight="bold" accessibilityRole="header">
              Pagos a cuenta
            </Text>
            {pagos.map((pago) => (
              <View key={pago.id} style={styles.pago}>
                <View style={styles.pagoDatos}>
                  <Text variant="body">{formatearFechaCorta(pago.fecha) ?? ''}</Text>
                  {pago.metodoPago || pago.nota ? (
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {[pago.metodoPago, pago.nota].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <Text variant="body" weight="bold" family="text" tone="success">
                  {formatearMoneda(pago.monto)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.acciones}>
          {/*
            Registrar pago todavia no tiene endpoint documentado: va apagado y
            con el motivo escrito, en vez de no estar. Asi se ve que el lugar
            existe y no parece que faltara algo.
          */}
          <Button
            label="Cargar ticket"
            // Dentro del stack de Facturas, por lo mismo que `irAlTicket`.
            onPress={() =>
              router.push({
                pathname: '/admin/facturas/[id]/ticket',
                params: { id, clienteId: cliente.id },
              })
            }
            disabled={!abierta}
            leftIcon={<Receipt size={16} color={theme.colors.onPrimary} />}
            style={styles.accion}
          />
          <Button
            label="Registrar pago"
            variant="secondary"
            disabled
            onPress={() => {}}
            leftIcon={<Wallet size={16} color={theme.colors.primary} />}
            style={styles.accion}
          />
        </View>
        <Text variant="caption" tone="muted">
          {abierta
            ? 'Registrar pagos se habilita cuando esté su endpoint.'
            : 'Este período ya está cerrado: no se le pueden cargar tickets.'}
        </Text>
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.md, paddingBottom: theme.spacing.xl },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cabecera: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    vencida: { borderColor: theme.colors.error },
    filaEstado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    seccion: { gap: theme.spacing.sm },
    pago: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    pagoDatos: { flex: 1, gap: 2 },
    acciones: { flexDirection: 'row', gap: theme.spacing.sm },
    accion: { flex: 1 },
  });
