import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Contact, IdCard, MapPin, Phone, User, UserPlus, Wallet } from 'lucide-react-native';
import { Controller, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Button, CampoControlado, EstadoVacio, Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import {
  CampoEmail,
  SeccionFormulario,
  SelectorVentanaPago,
  VistaPreviaCliente,
} from '../../components';
import { useCliente, useGuardarCliente } from '../../hooks';

/**
 * Alta y edicion de un cliente.
 *
 * Es la misma pantalla para los dos casos: los campos, las validaciones y los
 * errores son identicos. Lo unico que cambia es si viene un `id` en la ruta.
 *
 * Arriba va el cliente como va a quedar, y abajo los campos en tres bloques:
 * quien es (obligatorio), como contactarlo (opcional) y sus condiciones de
 * credito. Asi se ve de un vistazo que es lo minimo para darlo de alta.
 */
export function ClienteFormMovil() {
  // En el alta no hay `id`: la ruta es `/admin/clientes/nuevo`.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);

  const ficha = useCliente(id);
  const { form, enviar, esEdicion, cargando, error } = useGuardarCliente({
    clienteId: id,
    cliente: ficha.cliente,
  });

  const { control } = form;
  const nombre = useWatch({ control, name: 'nombre' });
  const dni = useWatch({ control, name: 'dni' });
  const limiteCredito = useWatch({ control, name: 'limiteCredito' });
  const desdeDia = useWatch({ control, name: 'desdeDia' });
  const hastaDia = useWatch({ control, name: 'hastaDia' });
  const { errors } = form.formState;

  const volver = () => router.back();

  /** Un icono dentro del campo: dice que va ahi antes de leer la etiqueta. */
  const icono = (Icono: typeof User) => (
    <Icono size={18} color={theme.colors.textMuted} strokeWidth={1.9} />
  );

  // En edicion hay que esperar los datos: dibujar el formulario vacio y dejar
  // que la persona escriba encima terminaria pisando lo que ya estaba.
  if (id && ficha.cargando) {
    return (
      <Pantalla titulo="Editar cliente" onVolver={volver} labelVolver="Cliente">
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  // Sin los datos no se edita: el formulario vacio se leeria como "Nuevo
  // cliente" y guardar pisaria lo que habia.
  if (id && !ficha.cliente) {
    return (
      <Pantalla titulo="Editar cliente" onVolver={volver} labelVolver="Cliente">
        <EstadoVacio
          titulo={ficha.noExiste ? 'Este cliente no existe' : 'No pudimos traer al cliente'}
          descripcion={ficha.noExiste ? undefined : (ficha.error ?? undefined)}
          accion={
            ficha.noExiste ? undefined : (
              <Button label="Reintentar" variant="secondary" onPress={ficha.reintentar} />
            )
          }
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla
      titulo={esEdicion ? 'Editar cliente' : 'Nuevo cliente'}
      descripcion={
        esEdicion ? 'Se guarda solo lo que cambies.' : 'Al crearlo se le abre su primera factura.'
      }
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
          <VistaPreviaCliente
            nombre={nombre}
            dni={dni}
            limiteCredito={limiteCredito}
            desdeDia={desdeDia}
            hastaDia={hastaDia}
          />

          {error ? (
            <Text variant="body" tone="error" accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <SeccionFormulario
            icono={User}
            titulo="Datos"
            // En el alta avisa que es lo minimo; editando no hay nada que crear.
            descripcion={esEdicion ? undefined : 'Con esto ya se puede crear.'}
          >
            <CampoControlado
              control={control}
              name="nombre"
              label="Nombre y apellido"
              required
              placeholder="Ana Gallo"
              autoCapitalize="words"
              returnKeyType="next"
              leftSlot={icono(User)}
            />
            <CampoControlado
              control={control}
              name="dni"
              label="DNI"
              required
              placeholder="33333333"
              helperText="Sin puntos. Es lo que identifica al cliente."
              keyboardType="number-pad"
              maxLength={9}
              returnKeyType="next"
              leftSlot={icono(IdCard)}
            />
          </SeccionFormulario>

          <SeccionFormulario
            icono={Contact}
            titulo="Contacto"
            descripcion="Para avisarle cuando se le vence la factura."
            opcional
          >
            <CampoControlado
              control={control}
              name="telefono"
              label="Teléfono"
              placeholder="11 5566 7788"
              keyboardType="phone-pad"
              returnKeyType="next"
              leftSlot={icono(Phone)}
            />

            {/* Partido en dos: se escribe lo de antes de la @ y la terminacion se
                elige. Al formulario le llega el mail entero, ya unido. */}
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur }, fieldState: { error: fallo } }) => (
                <CampoEmail
                  valor={value}
                  onCambiar={onChange}
                  onBlur={onBlur}
                  error={fallo?.message}
                />
              )}
            />

            <CampoControlado
              control={control}
              name="direccion"
              label="Dirección"
              placeholder="Calle 123"
              autoCapitalize="sentences"
              returnKeyType="next"
              leftSlot={icono(MapPin)}
            />
          </SeccionFormulario>

          <SeccionFormulario
            icono={Wallet}
            titulo="Crédito"
            descripcion="Cuánto se le fía y cuándo paga."
          >
            <CampoControlado
              control={control}
              name="limiteCredito"
              label="Límite de crédito"
              placeholder="0"
              helperText="Vacío o 0 = sin límite. Si lo pasa, se avisa pero no se bloquea."
              monto
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
                Cambiar la ventana afecta a las facturas que se abran de ahora en más. La que está
                abierta hoy mantiene su vencimiento.
              </Text>
            ) : null}
          </SeccionFormulario>

          <Button
            label={esEdicion ? 'Guardar cambios' : 'Crear cliente'}
            onPress={enviar}
            loading={cargando}
            size="lg"
            fullWidth
            leftIcon={
              esEdicion ? (
                <Check size={18} color={theme.colors.onPrimary} strokeWidth={2.4} />
              ) : (
                <UserPlus size={18} color={theme.colors.onPrimary} strokeWidth={2.2} />
              )
            }
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
