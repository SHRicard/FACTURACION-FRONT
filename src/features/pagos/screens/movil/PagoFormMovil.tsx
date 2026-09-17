import { useLocalSearchParams, useRouter } from 'expo-router';
import { Wallet } from 'lucide-react-native';
import { Controller } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { useCliente } from '@/features/clientes/hooks';
import { useFacturaDetalle } from '@/features/facturas/hooks';
import {
  Badge,
  Button,
  CampoControlado,
  EstadoVacio,
  Modal,
  Pantalla,
  Text,
} from '@/shared/ui/atoms';
import { formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { MontoPago, SelectorMetodoPago } from '../../components';
import { etiquetaFactura, nombreMetodo, textoFacturaSaldada } from '../../formato';
import { useRegistrarPago } from '../../hooks';

/**
 * Registrar un pago: el cliente pasa y deja plata, sin llevarse nada.
 *
 * Se llega por dos lados y es el mismo formulario:
 * - Desde la ficha del cliente: la plata va a su factura en curso.
 * - Desde el detalle de una factura: todo va a esa factura.
 * Las dos terminan en el mismo lugar: el cliente tiene una sola factura con deuda.
 *
 * No pide confirmacion antes de guardar —hace mas lento el caso normal— pero SI
 * muestra el comprobante despues: dejo, debia, queda.
 */
export function PagoFormMovil() {
  /*
   * De donde sale cada id depende de por donde se entro:
   * - Desde la ficha (`/admin/clientes/:id/pago`), `id` ES el cliente.
   * - Desde la factura (`/admin/facturas/:id/pago`), `id` es la FACTURA y el
   *   cliente viaja como `clienteId`. Ese camino existe para que el formulario
   *   quede en el stack de Facturas y "atras" vuelva a la factura.
   */
  const params = useLocalSearchParams<{ id: string; clienteId?: string }>();
  const facturaId = params.clienteId ? params.id : undefined;
  const clienteId = params.clienteId ?? params.id;
  const labelVolver = facturaId ? 'Factura' : 'Cliente';

  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);

  const ficha = useCliente(clienteId);
  // Sin factura, `useFacturaDetalle` no pide nada.
  const cuenta = useFacturaDetalle(facturaId ?? '');

  // A una factura: su saldo. Al cliente: la deuda total de la ficha.
  const deuda = facturaId ? (cuenta.detalle?.factura.saldo ?? 0) : (ficha.cliente?.deuda ?? 0);
  const pago = useRegistrarPago({ clienteId, facturaId, deuda });

  const volver = () => router.back();
  // El mismo titulo por las dos puertas: a que factura va lo dice la bajada,
  // al lado del nombre ("Ana Díaz · N° 0012").
  const titulo = 'Registrar pago';

  if (ficha.cargando || (facturaId && cuenta.cargando)) {
    return (
      <Pantalla titulo={titulo} ancho="formulario" onVolver={volver} labelVolver={labelVolver}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  if (!ficha.cliente || (facturaId && !cuenta.detalle)) {
    return (
      <Pantalla titulo={titulo} ancho="formulario" onVolver={volver} labelVolver={labelVolver}>
        <EstadoVacio
          titulo="No pudimos traer la cuenta"
          descripcion={(facturaId ? cuenta.error : ficha.error) ?? undefined}
          accion={<Button label="Volver" variant="secondary" onPress={volver} />}
        />
      </Pantalla>
    );
  }

  const factura = cuenta.detalle?.factura;
  // Solo la factura en curso recibe pagos: una pagada o anulada no.
  const facturaRecibe = !factura || factura.estado === 'abierta';

  /*
   * Sin deuda no hay nada que cobrar. El backend lo rechazaria con un 400; aca
   * se dice antes, en vez de dejar llenar un formulario que no se va a guardar.
   */
  if (deuda <= 0 || !facturaRecibe) {
    return (
      <Pantalla titulo={titulo} ancho="formulario" onVolver={volver} labelVolver={labelVolver}>
        <EstadoVacio
          icono={<Wallet size={theme.typography.size.heading} color={theme.colors.textMuted} />}
          titulo={facturaId ? 'Esta factura no recibe pagos' : 'No debe nada'}
          descripcion={
            facturaId
              ? 'Ya está saldada o anulada: no tiene saldo pendiente.'
              : `${ficha.cliente.nombre} está al día. Si deja plata, se da el vuelto: no se anota como saldo a favor.`
          }
          accion={<Button label="Volver" variant="secondary" onPress={volver} />}
        />
      </Pantalla>
    );
  }

  const comprobante = pago.comprobante;
  // El pago que la deja en cero la cierra solo: vuelve `pagada`, con numero y cumplimiento.
  const saldadas = comprobante?.facturas.filter((tocada) => tocada.estado === 'pagada') ?? [];
  const listoParaGuardar = pago.montoNumero > 0 && !pago.excede;

  return (
    <Pantalla
      titulo={titulo}
      // A que se aplica va arriba, junto al nombre: la tarjeta del monto queda
      // solo para los numeros.
      descripcion={
        factura
          ? `${ficha.cliente.nombre} · ${etiquetaFactura(factura.numero)}`
          : ficha.cliente.nombre
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
          {/* Una sola tarjeta con lo que debe, lo que deja y lo que le queda:
              antes eran dos recuadros que repetian el mismo numero. */}
          <Controller
            control={pago.form.control}
            name="monto"
            render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
              <MontoPago
                valor={value}
                onCambiar={onChange}
                onBlur={onBlur}
                deuda={deuda}
                quedaDebiendo={pago.quedaDebiendo}
                onTodo={pago.pagarTodo}
                error={error?.message ?? (pago.excede ? pago.mensajeExcede : undefined)}
              />
            )}
          />

          <View style={styles.campo}>
            <Text variant="caption" tone="muted">
              Cómo pagó
            </Text>
            <Controller
              control={pago.form.control}
              name="metodoPago"
              render={({ field: { value, onChange } }) => (
                <SelectorMetodoPago valor={value} onCambiar={onChange} />
              )}
            />
          </View>

          <CampoControlado
            control={pago.form.control}
            name="nota"
            label="Nota (opcional)"
            placeholder="Le pagaron el aguinaldo"
            maxLength={300}
            autoCapitalize="sentences"
            returnKeyType="done"
          />

          {/* Red de seguridad: lo que valida el front ya se marco en el campo. */}
          {pago.error ? (
            <Text variant="caption" tone="error">
              {pago.error}
            </Text>
          ) : null}

          {/* Un solo boton, con el monto adentro: se lee lo que se va a guardar
              antes de tocarlo. Para irse sin guardar esta la flecha de arriba. */}
          <Button
            label={
              listoParaGuardar ? `Registrar ${formatearMoneda(pago.montoNumero)}` : 'Registrar pago'
            }
            onPress={pago.enviar}
            disabled={!listoParaGuardar}
            // Bloqueado mientras va el request: dos toques serian dos pagos.
            loading={pago.guardando}
            size="lg"
            fullWidth
            leftIcon={<Wallet size={18} color={theme.colors.onPrimary} />}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* El comprobante: dejo, debia, queda. Es lo que se le dice al cliente. */}
      <Modal
        visible={comprobante !== null}
        onClose={pago.cerrarComprobante}
        titulo="Pago registrado"
        descripcion={
          comprobante
            ? `Dejó ${formatearMoneda(comprobante.entrega.monto)} · debía ${formatearMoneda(comprobante.entrega.saldoAnterior)} · queda ${formatearMoneda(comprobante.entrega.saldoPosterior)}.`
            : undefined
        }
        acciones={<Button label="Listo" onPress={pago.cerrarComprobante} />}
      >
        {comprobante ? (
          <View style={styles.comprobante}>
            <View style={styles.linea}>
              <Badge
                label={comprobante.entrega.tipo}
                tone={comprobante.entrega.tipo === 'completo' ? 'success' : 'primary'}
              />
              <Text variant="caption" tone="muted" style={styles.flex}>
                {nombreMetodo(comprobante.entrega.metodoPago)}
              </Text>
            </View>
            {saldadas.map((tocada) => (
              <View key={tocada.id} style={styles.saldada}>
                <Text variant="body" weight="medium" tone="success">
                  {textoFacturaSaldada(tocada)}
                </Text>
                <Text variant="caption" tone="muted">
                  La próxima compra abre una factura nueva.
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Modal>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    teclado: { flex: 1 },
    scroll: { gap: theme.spacing.lg, paddingBottom: theme.spacing.xl },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    campo: { gap: theme.spacing.xs },
    comprobante: { gap: theme.spacing.sm },
    linea: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    flex: { flex: 1 },
    saldada: { gap: theme.spacing.xs },
  });
