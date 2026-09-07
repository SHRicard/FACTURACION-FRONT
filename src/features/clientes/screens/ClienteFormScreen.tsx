import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Button, CampoControlado, Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { SelectorVentanaPago } from '../components';
import { useCliente, useGuardarCliente } from '../hooks';

/**
 * Alta y edicion de un cliente.
 *
 * Es la misma pantalla para los dos casos: los campos, las validaciones y los
 * errores son identicos. Lo unico que cambia es si viene un `id` en la ruta.
 */
export function ClienteFormScreen() {
  // En el alta no hay `id`: la ruta es `/admin/clientes/nuevo`.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);

  const ficha = useCliente(id);
  const { form, enviar, esEdicion, cargando, error } = useGuardarCliente({
    cliente: ficha.cliente,
  });

  const desdeDia = useWatch({ control: form.control, name: 'desdeDia' });
  const hastaDia = useWatch({ control: form.control, name: 'hastaDia' });
  const { errors } = form.formState;

  const volver = () => router.back();

  // En edicion hay que esperar los datos: dibujar el formulario vacio y dejar
  // que la persona escriba encima terminaria pisando lo que ya estaba.
  if (id && ficha.cargando) {
    return (
      <Pantalla titulo="Editar cliente" ancho="formulario" onVolver={volver} labelVolver="Cliente">
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla
      titulo={esEdicion ? 'Editar cliente' : 'Nuevo cliente'}
      descripcion={
        esEdicion ? 'Se manda solo lo que cambies.' : 'Al crearlo se le abre su primera factura.'
      }
      ancho="formulario"
      onVolver={volver}
      // Editar se abre desde la ficha del cliente; alta, desde el listado.
      labelVolver={esEdicion ? 'Cliente' : 'Clientes'}
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
          {error ? (
            <Text variant="body" tone="error" accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <CampoControlado
            control={form.control}
            name="nombre"
            label="Nombre"
            required
            placeholder="Nombre y apellido"
            autoCapitalize="words"
            returnKeyType="next"
          />

          <CampoControlado
            control={form.control}
            name="dni"
            label="DNI"
            required
            placeholder="33333333"
            helperText="Sin puntos. Es lo que identifica al cliente."
            keyboardType="number-pad"
            returnKeyType="next"
          />

          <CampoControlado
            control={form.control}
            name="telefono"
            label="Telefono"
            placeholder="1155667788"
            keyboardType="phone-pad"
            returnKeyType="next"
          />

          <CampoControlado
            control={form.control}
            name="email"
            label="Email"
            placeholder="cliente@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <CampoControlado
            control={form.control}
            name="direccion"
            label="Direccion"
            placeholder="Calle 123"
            autoCapitalize="sentences"
            returnKeyType="next"
          />

          <CampoControlado
            control={form.control}
            name="limiteCredito"
            label="Limite de credito"
            placeholder="0"
            helperText="Vacio o 0 = sin limite."
            keyboardType="number-pad"
            returnKeyType="done"
          />

          <SelectorVentanaPago
            desdeDia={desdeDia}
            hastaDia={hastaDia}
            onChange={(desde, hasta) => {
              form.setValue('desdeDia', desde, { shouldValidate: true, shouldDirty: true });
              form.setValue('hastaDia', hasta, { shouldValidate: true, shouldDirty: true });
            }}
            error={errors.hastaDia?.message ?? errors.desdeDia?.message}
          />

          {esEdicion ? (
            <Text variant="caption" tone="muted">
              Cambiar la ventana afecta a las facturas que se abran de ahora en mas. La que esta
              abierta hoy mantiene su vencimiento.
            </Text>
          ) : null}

          <Button
            label={esEdicion ? 'Guardar cambios' : 'Crear cliente'}
            onPress={enviar}
            loading={cargando}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    teclado: { flex: 1 },
    scroll: { gap: theme.spacing.md, paddingBottom: theme.spacing.xl },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });
