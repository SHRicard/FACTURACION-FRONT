import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ban, Check, Plus, Shapes } from 'lucide-react-native';
import { useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { useCliente } from '@/features/clientes/hooks';
import { useEspeciesActivas } from '@/features/especies/hooks';
import { Button, EstadoVacio, Input, Modal, Pantalla, Text } from '@/shared/ui/atoms';
import {
  formatearFecha,
  formatearFechaCorta,
  formatearMoneda,
  formatearVentanaPago,
} from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { CampoVencimiento, RenglonTicket, ResumenTicket } from '../../components';
import { useAnularTicket, useGuardarTicket } from '../../hooks';

/**
 * Cargar un ticket, y corregir uno ya cargado.
 *
 * Es la pantalla mas usada de la app y se usa de pie, con el cliente enfrente:
 * arranca con un renglon listo para escribir y todo lo demas es opcional.
 *
 * La misma pantalla sirve para las dos cosas porque los campos, las reglas y la
 * respuesta son identicos; lo unico que cambia es el endpoint y que corrigiendo
 * aparece el boton de anular.
 *
 * No pide confirmacion al guardar a proposito: un modal de "¿seguro?" hace mas
 * lento el caso normal, que es el 99%. Anular SI la pide — eso no se deshace.
 */
export function TicketFormMovil() {
  /*
   * De donde sale el cliente depende de por donde se entro:
   * - Desde la ficha (`/admin/clientes/:id/...`), `id` ES el cliente.
   * - Desde la factura (`/admin/facturas/:id/...`), `id` es la FACTURA y el
   *   cliente viaja aparte como `clienteId`. Ese camino existe para que el
   *   ticket quede en el stack de Facturas y "atras" vuelva a la factura en vez
   *   de saltar de tab.
   */
  const params = useLocalSearchParams<{ id: string; ticketId?: string; clienteId?: string }>();
  const { ticketId } = params;
  const clienteId = params.clienteId ?? params.id;
  const labelVolver = params.clienteId ? 'Factura' : 'Cliente';
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);

  const ficha = useCliente(clienteId);
  const especies = useEspeciesActivas();
  const facturaAbiertaId = ficha.cliente?.facturaAbierta?.id;
  const ticket = useGuardarTicket({ clienteId, ticketId, facturaAbiertaId });
  const anulacion = useAnularTicket(ticketId, clienteId);

  // Los subtotales se recalculan en cada tecla, asi que se miran desde aca y
  // bajan por props: un `useWatch` por renglon redibujaria de mas.
  const items = useWatch({ control: ticket.form.control, name: 'items' });

  const volver = () => router.back();
  const titulo = ticket.esEdicion ? 'Corregir ticket' : 'Nuevo ticket';

  if (especies.cargando || ficha.cargando || ticket.cargando) {
    return (
      <Pantalla titulo={titulo} ancho="formulario" onVolver={volver} labelVolver={labelVolver}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  if (ticket.esEdicion && !ticket.ticket) {
    return (
      <Pantalla titulo={titulo} ancho="formulario" onVolver={volver} labelVolver={labelVolver}>
        <EstadoVacio
          titulo={ticket.noExiste ? 'Este ticket no existe' : 'No pudimos traer el ticket'}
          descripcion={
            ticket.noExiste ? 'Puede que lo hayan borrado.' : (ticket.errorCarga ?? undefined)
          }
          accion={<Button label="Volver" variant="secondary" onPress={volver} />}
        />
      </Pantalla>
    );
  }

  /*
   * Sin especies no se puede cargar un ticket: cada renglon necesita una. En
   * vez de un selector vacio —que no le dice a nadie que primero hay que crear
   * una— se manda derecho a la pantalla donde se crean.
   */
  if (especies.vacio) {
    return (
      <Pantalla titulo={titulo} ancho="formulario" onVolver={volver} labelVolver={labelVolver}>
        <EstadoVacio
          icono={<Shapes size={theme.typography.size.heading} color={theme.colors.textMuted} />}
          titulo="Primero cargá una especie"
          descripcion="Cada renglón del ticket necesita un tipo de mercadería: Pantalón, Zapatilla. Son dos campos y se cargan una sola vez."
          accion={
            <Button label="Ir a Especies" onPress={() => router.push('/admin/cuenta/especies')} />
          }
        />
      </Pantalla>
    );
  }

  /*
   * Un ticket se toca mientras su factura sigue abierta. Despues queda
   * congelado: ya tiene numero y el cliente vio ese resumen, asi que cambiarle
   * los renglones por atras reescribiria algo que ya se comunico.
   */
  if (ticket.esEdicion && !ticket.sePuedeTocar) {
    const anulado = ticket.ticket?.anulado;

    return (
      <Pantalla titulo={titulo} ancho="formulario" onVolver={volver} labelVolver={labelVolver}>
        <EstadoVacio
          icono={<Ban size={theme.typography.size.heading} color={theme.colors.textMuted} />}
          titulo={anulado ? 'Este ticket está anulado' : 'Este ticket ya está cerrado'}
          descripcion={
            anulado
              ? `Se anuló el ${formatearFecha(ticket.ticket?.anuladoEl) ?? 'día que figura en la cuenta'}${ticket.ticket?.motivoAnulacion ? `: ${ticket.ticket.motivoAnulacion}` : '.'} No se puede deshacer: si hizo falta, cargá el ticket de nuevo.`
              : 'Pertenece a una factura que ya se saldó. Los tickets se corrigen mientras la factura sigue abierta.'
          }
          accion={<Button label="Volver" variant="secondary" onPress={volver} />}
        />
      </Pantalla>
    );
  }

  const resultado = ticket.resultado;

  /*
   * El vencimiento se acuerda con el PRIMER ticket de la factura: despues ya
   * esta fijado y se cambia desde la factura. La ficha trae la factura en curso,
   * asi que para saberlo no hace falta otra request.
   */
  const facturaEnCurso = ficha.cliente?.facturaAbierta;
  const eligeVencimiento =
    !ticket.esEdicion &&
    ficha.cliente != null &&
    (!facturaEnCurso || facturaEnCurso.cantidadTickets === 0);
  const ventanaPago = ficha.cliente
    ? formatearVentanaPago(ficha.cliente.ventanaPago.desdeDia, ficha.cliente.ventanaPago.hastaDia)
    : '';

  return (
    <Pantalla
      titulo={titulo}
      // Corrigiendo, la fecha dice CUAL ticket es: un cliente tiene varios en
      // la misma factura y se parecen.
      descripcion={
        ficha.cliente
          ? [
              ficha.cliente.nombre,
              ticket.esEdicion && ticket.ticket
                ? `del ${formatearFechaCorta(ticket.ticket.fecha)}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')
          : undefined
      }
      ancho="formulario"
      onVolver={volver}
      labelVolver={labelVolver}
    >
      <KeyboardAvoidingView
        style={styles.teclado}
        // En iOS el teclado tapa el campo de abajo si no se corre la vista;
        // en Android el sistema ya redimensiona la ventana.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {ticket.renglones.map((renglon, indice) => (
            <RenglonTicket
              key={renglon.id}
              control={ticket.form.control}
              indice={indice}
              especies={especies.especies}
              cantidad={items?.[indice]?.cantidad ?? ''}
              precioUnitario={items?.[indice]?.precioUnitario ?? ''}
              onQuitar={ticket.quitar}
              puedeQuitar={ticket.puedeQuitar}
            />
          ))}

          {/*
            Apagado hasta que los renglones de arriba esten completos. Apagado y
            no escondido: quien lo busca tiene que encontrarlo y entender por
            que no puede tocarlo, no preguntarse a donde se fue.
          */}
          <View style={styles.agregar}>
            {/* Borde punteado: se lee como "aca entra otro", no como una accion
                que compite con guardar. */}
            <Pressable
              onPress={ticket.agregar}
              disabled={!ticket.puedeAgregar}
              accessibilityRole="button"
              accessibilityState={{ disabled: !ticket.puedeAgregar }}
              accessibilityLabel="Agregar otro artículo"
              style={({ pressed }) => [
                styles.botonAgregar,
                !ticket.puedeAgregar && styles.apagado,
                pressed && styles.presionado,
              ]}
            >
              <Plus size={18} color={theme.colors.primary} strokeWidth={2.4} />
              <Text weight="bold" tone="primary">
                Agregar otro artículo
              </Text>
            </Pressable>
            {ticket.puedeAgregar ? null : (
              <Text variant="caption" tone="muted" center>
                Completá el artículo de arriba para poder sumar otro.
              </Text>
            )}
          </View>

          <ResumenTicket
            control={ticket.form.control}
            total={ticket.total}
            dejaAhora={ticket.dejaAhora}
            quedaDebiendo={ticket.quedaDebiendo}
            onPagarTodo={ticket.pagarTodo}
          />

          {eligeVencimiento ? (
            <CampoVencimiento control={ticket.form.control} ventanaPago={ventanaPago} />
          ) : !ticket.esEdicion && facturaEnCurso ? (
            // Ya tiene tickets: la fecha quedo fijada con el primero.
            <Text variant="caption" tone="muted">
              Se suma a su factura en curso, que {facturaEnCurso.vencida ? 'venció' : 'vence'} el{' '}
              {formatearFecha(facturaEnCurso.venceEl) ?? 'día acordado'}.
            </Text>
          ) : null}

          {/* Red de seguridad: la validacion del front ya marco lo que pudo en
              cada renglon, y lo que llegue de mas viene redactado del backend. */}
          {ticket.error || anulacion.error ? (
            <Text variant="caption" tone="error">
              {ticket.error ?? anulacion.error}
            </Text>
          ) : null}

          {/* Un solo boton a lo ancho: para irse sin guardar esta la flecha de
              arriba, igual que en el pago. */}
          <Button
            label={ticket.esEdicion ? 'Guardar cambios' : 'Guardar ticket'}
            onPress={ticket.enviar}
            // Bloqueado mientras va el request: dos toques serian dos tickets.
            loading={ticket.guardando}
            size="lg"
            fullWidth
            leftIcon={<Check size={18} color={theme.colors.onPrimary} strokeWidth={2.4} />}
          />

          {/*
            Anular vive abajo de todo y separado: es destructivo y no se deshace,
            asi que no tiene que estar al lado de guardar. Va con contorno y no
            relleno: un bloque rojo lleno gritaba mas que el boton de guardar,
            que es lo que se viene a hacer.
          */}
          {ticket.esEdicion ? (
            <View style={styles.zonaAnular}>
              <Pressable
                onPress={anulacion.pedirConfirmacion}
                accessibilityRole="button"
                accessibilityLabel="Anular ticket"
                style={({ pressed }) => [styles.botonAnular, pressed && styles.presionado]}
              >
                <Ban size={18} color={theme.colors.error} strokeWidth={2.2} />
                <Text weight="bold" tone="error">
                  Anular ticket
                </Text>
              </Pressable>
              <Text variant="caption" tone="muted" center>
                Queda tachado en la cuenta, con el motivo. Deja de sumar al saldo.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/*
        Solo aparece cuando hay algo que contar: el limite superado. Si no, se
        vuelve derecho a la ficha.
      */}
      <Modal
        visible={resultado !== null}
        onClose={ticket.cerrarResultado}
        titulo={ticket.esEdicion ? 'Ticket corregido' : 'Ticket guardado'}
        descripcion={
          resultado
            ? `Quedó debiendo ${formatearMoneda(resultado.faltante)} de este ticket. Su factura en curso va ${formatearMoneda(resultado.saldo)}.`
            : undefined
        }
        acciones={<Button label="Ver la cuenta" onPress={ticket.cerrarResultado} />}
      >
        <View style={styles.avisos}>
          {resultado?.warning ? (
            // El limite AVISA, no bloquea: el ticket ya se guardo. Por eso va en
            // ambar y no en rojo, y despues de guardar y no antes.
            <View style={styles.aviso}>
              <Text variant="body" weight="bold" tone="warning">
                Superó su límite de crédito
              </Text>
              <Text variant="caption" tone="muted">
                {resultado.warning}
              </Text>
            </View>
          ) : null}
        </View>
      </Modal>

      {/*
        Anular SI se confirma: no se deshace, y el total a la vista es lo que
        deja darse cuenta de que se esta por anular el ticket equivocado.
      */}
      <Modal
        visible={anulacion.confirmando}
        onClose={anulacion.cancelar}
        titulo="¿Anular este ticket?"
        descripcion={`Son ${formatearMoneda(ticket.total)} que dejan de sumar a la cuenta. No se puede deshacer: si hace falta, se carga de nuevo.`}
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
          <Text variant="caption" tone="muted">
            Motivo (opcional)
          </Text>
          <Input
            value={anulacion.motivo}
            onChangeText={anulacion.setMotivo}
            placeholder="Lo cargué en el cliente equivocado"
            autoCapitalize="sentences"
            accessibilityLabel="Motivo de la anulación"
          />
          <Text variant="caption" tone="muted">
            Es lo que explica, dentro de unos meses, por qué la cuenta cambió.
          </Text>
        </View>
      </Modal>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    teclado: { flex: 1 },
    scroll: { gap: theme.spacing.md, paddingBottom: theme.spacing.xl },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    agregar: { gap: theme.spacing.xs },
    botonAgregar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      minHeight: 52,
      borderRadius: theme.radius.lg,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: theme.colors.primary,
    },
    apagado: { opacity: 0.4 },
    presionado: { opacity: 0.6 },
    zonaAnular: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    botonAnular: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      minHeight: 48,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
    avisos: { gap: theme.spacing.md },
    aviso: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    motivo: { gap: theme.spacing.xs },
  });
