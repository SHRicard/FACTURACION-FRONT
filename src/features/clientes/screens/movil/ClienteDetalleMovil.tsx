import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pencil, Receipt, ScrollText, Wallet } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { BotonIcono, Button, EstadoVacio, Pantalla, Text } from '@/shared/ui/atoms';
import { formatearMoneda, formatearVentanaPago } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { TarjetaFacturaAbierta } from '../../components';
import { useCliente } from '../../hooks';

/** Un dato del cliente. Etiqueta y valor se leen juntos. */
function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.dato} accessible accessibilityLabel={`${etiqueta}: ${valor}`}>
      <Text variant="caption" tone="muted">
        {etiqueta}
      </Text>
      <Text variant="body" weight="medium" family="text">
        {valor}
      </Text>
    </View>
  );
}

/**
 * Ficha de un cliente: cuanto debe, su factura en curso y sus datos.
 *
 * La deuda va arriba de todo porque es lo que se viene a mirar: el resto es
 * contexto.
 */
export function ClienteDetalleMovil() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const ficha = useCliente(id);
  const refresco = useRefrescar(ficha.refrescar);

  const volver = () => router.back();

  if (ficha.cargando && !refresco.refrescando) {
    return (
      <Pantalla titulo="Cliente" ancho="contenido" onVolver={volver} labelVolver="Clientes">
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  if (!ficha.cliente) {
    return (
      <Pantalla titulo="Cliente" ancho="contenido" onVolver={volver} labelVolver="Clientes">
        <EstadoVacio
          titulo={ficha.noExiste ? 'Este cliente no existe' : 'No pudimos traer el cliente'}
          descripcion={
            ficha.noExiste
              ? 'Puede que lo hayan dado de baja, o que el link este mal.'
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

  const cliente = ficha.cliente;
  const superaLimite = cliente.limiteCredito > 0 && cliente.deuda > cliente.limiteCredito;

  return (
    <Pantalla
      titulo={cliente.nombre}
      descripcion={`DNI ${cliente.dni}`}
      ancho="contenido"
      onVolver={volver}
      labelVolver="Clientes"
      accion={
        <BotonIcono
          accessibilityLabel="Editar cliente"
          onPress={() => router.push(`/admin/clientes/${cliente.id}/editar`)}
        >
          <Pencil size={22} color={theme.colors.primary} strokeWidth={1.9} />
        </BotonIcono>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <View style={[styles.deuda, cliente.deuda > 0 && styles.deudaActiva]}>
          <Text variant="caption" tone="muted">
            Deuda total
          </Text>
          <Text
            variant="heading"
            weight="bold"
            family="text"
            tone={cliente.deuda > 0 ? 'default' : 'muted'}
          >
            {formatearMoneda(cliente.deuda)}
          </Text>
          <Text variant="caption" tone="muted">
            Lo que quedó sin pagar de su factura en curso.
          </Text>
          {superaLimite ? (
            <Text variant="caption" tone="warning">
              Supera su limite de credito de {formatearMoneda(cliente.limiteCredito)}.
            </Text>
          ) : null}
        </View>

        {cliente.facturaAbierta ? (
          <TarjetaFacturaAbierta
            factura={cliente.facturaAbierta}
            // Salta al tab de Facturas. `withAnchor` deja la lista de facturas
            // debajo: sin eso el tab queda con la factura sola, "atras" cae en
            // el Dashboard y al volver al tab no aparece el listado.
            onPress={(facturaId) =>
              router.push(`/admin/facturas/${facturaId}`, { withAnchor: true })
            }
          />
        ) : (
          <Text variant="caption" tone="muted">
            No tiene ninguna factura abierta en este momento.
          </Text>
        )}

        <View style={styles.acciones}>
          <Button
            label="Cargar ticket"
            onPress={() => router.push(`/admin/clientes/${cliente.id}/ticket`)}
            leftIcon={<Receipt size={16} color={theme.colors.onPrimary} />}
            style={styles.accion}
          />
          {/* Sin deuda no hay nada que cobrar: el boton no aparece, en vez de
              abrir un formulario que el backend rechazaria con un 400. */}
          {cliente.deuda > 0 ? (
            <Button
              label="Registrar pago"
              variant="secondary"
              onPress={() => router.push(`/admin/clientes/${cliente.id}/pago`)}
              leftIcon={<Wallet size={16} color={theme.colors.primary} />}
              style={styles.accion}
            />
          ) : null}
        </View>

        {/* Todo lo que compro y pago, y como cumplio cada factura. */}
        <Button
          label="Ver historial completo"
          variant="ghost"
          onPress={() => router.push(`/admin/clientes/${cliente.id}/historial`)}
          leftIcon={<ScrollText size={16} color={theme.colors.primary} />}
          fullWidth
        />

        <View style={styles.datos}>
          <Dato
            etiqueta="Ventana de pago"
            valor={`Paga ${formatearVentanaPago(cliente.ventanaPago.desdeDia, cliente.ventanaPago.hastaDia)}`}
          />
          <Dato
            etiqueta="Limite de credito"
            valor={
              cliente.limiteCredito > 0 ? formatearMoneda(cliente.limiteCredito) : 'Sin limite'
            }
          />
          {cliente.telefono ? <Dato etiqueta="Telefono" valor={cliente.telefono} /> : null}
          {cliente.email ? <Dato etiqueta="Email" valor={cliente.email} /> : null}
          {cliente.direccion ? <Dato etiqueta="Direccion" valor={cliente.direccion} /> : null}
        </View>
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.md, paddingBottom: theme.spacing.xl },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    deuda: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    deudaActiva: { borderColor: theme.colors.primary },
    acciones: { flexDirection: 'row', gap: theme.spacing.sm },
    accion: { flex: 1 },
    datos: {
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
    },
    dato: {
      gap: 2,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
  });
