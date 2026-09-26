import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { useEditarUsuario, useUsuarioAdmin } from '../../hooks';

/**
 * Correccion de datos de una cuenta: lo que la persona no puede tocar sola.
 * Se manda solo lo que cambio. Borrar el DNI la devuelve a "completá tu
 * perfil", salvo que ya tenga marca.
 */
export function EditarUsuarioMovil() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const ficha = useUsuarioAdmin(id);
  const { form, enviar, cargando, error, tieneMarca } = useEditarUsuario(ficha.detalle);

  const volver = () => router.back();

  // Sin los datos no se edita: guardar un formulario vacio pisaria lo que habia.
  if (ficha.cargando || !ficha.detalle) {
    return (
      <Pantalla titulo="Editar cuenta" ancho="formulario" onVolver={volver} labelVolver="Cuenta">
        {ficha.cargando ? (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <EstadoVacio
            titulo={ficha.noExiste ? 'Esta cuenta no existe' : 'No pudimos traer la cuenta'}
            descripcion={ficha.noExiste ? undefined : (ficha.error ?? undefined)}
            accion={
              ficha.noExiste ? undefined : (
                <Button label="Reintentar" variant="secondary" onPress={ficha.reintentar} />
              )
            }
          />
        )}
      </Pantalla>
    );
  }

  return (
    <Pantalla
      titulo="Editar cuenta"
      descripcion="Se guarda solo lo que cambies."
      ancho="formulario"
      onVolver={volver}
      labelVolver="Cuenta"
    >
      <KeyboardAvoidingView
        style={styles.teclado}
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
            autoCapitalize="words"
            returnKeyType="next"
          />
          <CampoControlado
            control={form.control}
            name="email"
            label="Email"
            required
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <CampoControlado
            control={form.control}
            name="dni"
            label="DNI"
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={enviar}
            helperText={
              tieneMarca
                ? 'Está en una marca: se puede corregir, pero no borrar.'
                : 'Vacío le saca el DNI y vuelve a pedírselo al entrar.'
            }
          />

          <Button label="Guardar" onPress={enviar} loading={cargando} fullWidth />
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
