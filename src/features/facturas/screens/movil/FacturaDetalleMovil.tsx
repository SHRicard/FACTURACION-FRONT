import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarClock, Lock, Receipt, Wallet } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { FilaPago } from '@/features/pagos/components';
import { fueRepartido } from '@/features/pagos/formato';
import { useAnularPago } from '@/features/pagos/hooks';
import { useRefrescar } from '@/shared/hooks';
import { Badge, Button, EstadoVacio, Input, Modal, Pantalla, Text } from '@/shared/ui/atoms';
import {
  chipCumplimiento,
  formatearFecha,
  formatearFechaCorta,
  formatearMoneda,
  textoVencimiento,
  tonoEstadoFactura,
} from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import {
  BloqueTicket,
  CambiarVencimiento,
  CerrarFactura,
  EnviarFactura,
  ResumenTotales,
} from '../../components';
import {
  useCerrarFactura,
  useEnviarFactura,
  useFacturaDetalle,
  useReprogramarVencimiento,
} from '../../hooks';

/**
 * La cuenta de una factura: los tickets, los pagos y los cinco totales.
 *
 * Es la misma pantalla se llegue desde el listado de facturacion o desde la
 * ficha del cliente, porque `GET /clientes/:id/factura-actual` devuelve
 * exactamente la misma forma que `GET /facturas/:id`.
 *
 * Se lee de arriba para abajo como la libreta: lo que se llevo (tickets), lo que
 * fue dejando (pagos), y al final la cuenta que cierra (totales).
 */
export function FacturaDetalleMovil() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const ficha = useFacturaDetalle(id);
  const refresco = useRefrescar(ficha.refrescar);
  // Antes de cualquier return: los hooks van siempre en el mismo orden.
  const anulacion = useAnularPago(ficha.detalle?.cliente.id);
  const envio = useEnviarFactura(ficha.detalle);
  const reprogramacion = useReprogramarVencimiento(
    ficha.detalle?.factura.id,
    ficha.detalle?.cliente.id,
  );
  const cierre = useCerrarFactura(ficha.detalle?.factura.id, ficha.detalle?.cliente.id);

  const volver = () => router.back();

  // Mi marca vive en el tab "Mas". `withAnchor` deja el menu debajo: al volver
  // de subir el logo, el tab no queda trabado en una pantalla suelta.
  const irASubirLogo = () => router.push('/admin/cuenta/marca', { withAnchor: true });

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
   * El numero se asigna al SALDARLA: la factura en curso no tiene, y la clave
   * puede ni siquiera venir en el JSON.
   */
  const etiqueta = factura.numero
    ? `N° ${String(factura.numero).padStart(4, '0')}`
    : 'Factura en curso';

  // Los tickets se cargan y se corrigen mientras la factura sigue abierta,
  // aunque este vencida; saldada queda congelada.
  const abierta = factura.estado === 'abierta';
  // Solo la factura en curso recibe pagos, y solo si todavia debe algo.
  const recibePagos = abierta && factura.saldo > 0;
  // Un pago se anula aunque la factura este pagada (vuelve a deber); solo una
  // factura anulada no se toca.
  const pagosAnulables = factura.estado !== 'anulada';
  // La fecha se fija con el primer ticket: sin tickets todavia no hay nada que mover.
  const sePuedeReprogramar = abierta && factura.cantidadTickets > 0;
  /*
   * En $0 y sin pagos a cuenta (todo se pago en el mostrador) nada la cierra
   * sola: si no se cierra a mano, la proxima compra se suma a esta.
   */
  const sePuedeCerrar = factura.estadoVisible === 'sin deuda';

  // Una saldada ya no corre plazo: se dice cuando se termino de pagar.
  const saldadaEl = factura.estado === 'pagada' ? formatearFecha(factura.pagadaEl) : null;
  // "Te pago el 30": la fecha se movio, pero el atraso se mide contra la original.
  const vencimientoAnterior = factura.reprogramada
    ? formatearFechaCorta(factura.vencimientoOriginal)
    : null;
  const cumplimiento = chipCumplimiento(factura);

  const cantidadPagos = factura.cantidadPagos ?? pagos.filter((pago) => !pago.anulado).length;
  const porcentaje = factura.porcentajeCobrado;

  const pagoAAnular = anulacion.pago;

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
              {etiqueta}
            </Text>
            {/* El chip sale de `estadoVisible`, NUNCA de `estado`. */}
            <Badge label={factura.estadoVisible} tone={tonoEstadoFactura(factura.estadoVisible)} />
          </View>
          {saldadaEl ? (
            <Text variant="caption" tone="muted">
              Saldada el {saldadaEl}
            </Text>
          ) : factura.diasParaVencer === null ? (
            // Sin compras: la fecha es provisoria, asi que no se muestra (K3).
            <Text variant="caption" tone="muted">
              {textoVencimiento(null)}
            </Text>
          ) : (
            <Text variant="caption" tone={factura.vencida ? 'error' : 'muted'}>
              {textoVencimiento(factura.diasParaVencer)} · vence el{' '}
              {formatearFecha(factura.venceEl) ?? 'sin fecha'}
            </Text>
          )}
          {vencimientoAnterior ? (
            <Text variant="caption" tone="muted">
              Reprogramada (antes: {vencimientoAnterior})
            </Text>
          ) : null}

          {cumplimiento || sePuedeReprogramar ? (
            <View style={styles.filaCabecera}>
              {cumplimiento ? <Badge label={cumplimiento.label} tone={cumplimiento.tone} /> : null}
              <View style={styles.espacio} />
              {sePuedeReprogramar ? (
                <Button
                  label="Cambiar fecha"
                  variant="ghost"
                  size="sm"
                  onPress={reprogramacion.abrir}
                  leftIcon={<CalendarClock size={16} color={theme.colors.primary} />}
                  accessibilityLabel="Cambiar la fecha de vencimiento"
                />
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.seccion}>
          <Text variant="title" weight="bold" accessibilityRole="header">
            Tickets
          </Text>

          {tickets.length === 0 ? (
            <Text variant="body" tone="muted">
              Todavía no se llevó nada en esta factura.
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
        <View style={styles.seccion}>
          <View style={styles.filaEstado}>
            <Text variant="title" weight="bold" accessibilityRole="header">
              Pagos
            </Text>
            {cantidadPagos > 0 || porcentaje != null ? (
              <Text variant="caption" tone="muted">
                {cantidadPagos}
                {porcentaje != null ? ` · ${porcentaje}% cobrado` : ''}
              </Text>
            ) : null}
          </View>

          {porcentaje != null && factura.totalFiado > 0 ? (
            <View
              style={styles.barra}
              accessibilityRole="progressbar"
              accessibilityLabel={`${porcentaje}% cobrado`}
            >
              <View
                style={[styles.relleno, { width: `${Math.min(100, Math.max(0, porcentaje))}%` }]}
              />
            </View>
          ) : null}

          {pagos.length === 0 ? (
            <Text variant="body" tone="muted">
              Todavía no dejó nada en esta factura.
            </Text>
          ) : (
            pagos.map((pago) => (
              <FilaPago
                key={pago.id}
                pago={pago}
                onAnular={pagosAnulables ? anulacion.pedirConfirmacion : undefined}
              />
            ))
          )}

          {anulacion.error ? (
            <Text variant="caption" tone="error">
              {anulacion.error}
            </Text>
          ) : null}
        </View>

        <ResumenTotales factura={factura} />

        {abierta ? (
          <View style={styles.acciones}>
            <Button
              label="Cargar ticket"
              // Dentro del stack de Facturas, por lo mismo que `irAlTicket`.
              onPress={() =>
                router.push({
                  pathname: '/admin/facturas/[id]/ticket',
                  params: { id, clienteId: cliente.id },
                })
              }
              leftIcon={<Receipt size={16} color={theme.colors.onPrimary} />}
              style={styles.accion}
            />
            {recibePagos ? (
              <Button
                // Mismo texto que en la ficha del cliente: estando adentro de la
                // factura ya se entiende que la plata va a esta.
                label="Registrar pago"
                variant="secondary"
                // Dentro del stack de Facturas: "atras" vuelve a esta factura.
                onPress={() =>
                  router.push({
                    pathname: '/admin/facturas/[id]/pago',
                    params: { id, clienteId: cliente.id },
                  })
                }
                leftIcon={<Wallet size={16} color={theme.colors.primary} />}
                style={styles.accion}
              />
            ) : null}
          </View>
        ) : (
          <Text variant="caption" tone="muted">
            {factura.estado === 'anulada'
              ? 'Esta factura está anulada: no se le cargan tickets.'
              : 'Esta factura ya está saldada: no se le cargan tickets. La próxima compra abre una nueva.'}
          </Text>
        )}

        {sePuedeCerrar ? (
          <View style={styles.cierre}>
            <Button
              label="Cerrar factura"
              variant="secondary"
              onPress={cierre.pedir}
              fullWidth
              leftIcon={<Lock size={16} color={theme.colors.primary} />}
            />
            <Text variant="caption" tone="muted">
              No debe nada, pero sigue abierta: si no la cerrás, la próxima compra se suma a esta.
            </Text>
          </View>
        ) : null}
        {cierre.error ? (
          <Text variant="caption" tone="error">
            {cierre.error}
          </Text>
        ) : null}

        {/* Una anulada no se le manda al cliente: el backend la rechaza. */}
        {factura.estado === 'anulada' ? null : (
          <EnviarFactura envio={envio} onSubirLogo={irASubirLogo} />
        )}
      </ScrollView>

      <CambiarVencimiento
        reprogramacion={reprogramacion}
        vencimientoOriginal={factura.vencimientoOriginal}
      />
      <CerrarFactura cierre={cierre} />

      {/*
        Anular SI se confirma: no se deshace, y el monto a la vista es lo que
        deja darse cuenta de que se esta por anular el pago equivocado. Si la
        plata se repartio (pagos de antes de la factura unica), se avisa que cae
        la entrega entera.
      */}
      <Modal
        visible={pagoAAnular !== null}
        onClose={anulacion.cancelar}
        titulo="¿Anular este pago?"
        descripcion={
          pagoAAnular
            ? `Son ${formatearMoneda(pagoAAnular.monto)} que dejan de descontar. No se puede deshacer: si hace falta, se registra de nuevo.`
            : undefined
        }
        acciones={
          <>
            <Button label="Cancelar" variant="ghost" onPress={anulacion.cancelar} />
            <Button
              label="Anular"
              variant="danger"
              loading={anulacion.anulando}
              onPress={anulacion.confirmar}
            />
          </>
        }
      >
        <View style={styles.motivo}>
          {pagoAAnular && fueRepartido(pagoAAnular) && pagoAAnular.montoEntrega != null ? (
            <Text variant="body" weight="medium" tone="warning">
              Era parte de una entrega de {formatearMoneda(pagoAAnular.montoEntrega)}: se anula la
              entrega entera, en todas las facturas que tocó.
            </Text>
          ) : null}
          <Text variant="caption" tone="muted">
            Motivo (opcional)
          </Text>
          <Input
            value={anulacion.motivo}
            onChangeText={anulacion.setMotivo}
            placeholder="Eran 4000, no 40000"
            autoCapitalize="sentences"
            accessibilityLabel="Motivo de la anulación"
          />
        </View>
      </Modal>
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
    // El chip de cumplimiento a la izquierda, "Cambiar fecha" a la derecha.
    filaCabecera: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    espacio: { flex: 1 },
    seccion: { gap: theme.spacing.sm },
    // La barra de lo cobrado: el riel es el total fiado, el relleno lo pagado.
    barra: {
      height: theme.spacing.sm,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.border,
      overflow: 'hidden',
    },
    relleno: { height: '100%', backgroundColor: theme.colors.success },
    acciones: { flexDirection: 'row', gap: theme.spacing.sm },
    accion: { flex: 1 },
    cierre: { gap: theme.spacing.xs },
    motivo: { gap: theme.spacing.xs },
  });
