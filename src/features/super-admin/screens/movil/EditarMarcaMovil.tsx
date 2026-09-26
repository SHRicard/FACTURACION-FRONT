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

import { useEditarMarca, useMarcaAdmin } from '../../hooks';

/**
 * Edicion de textos y colores de una marca, con las mismas reglas que la
 * edicion del dueno: lo que queda vacio se borra. El logo no se toca: lo
 * sube el dueno.
 */
export function EditarMarcaMovil() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const ficha = useMarcaAdmin(id);
  const { form, enviar, cargando, error } = useEditarMarca(ficha.detalle);

  const volver = () => router.back();

  if (ficha.cargando || !ficha.detalle) {
    return (
      <Pantalla titulo="Editar marca" ancho="formulario" onVolver={volver} labelVolver="Marca">
        {ficha.cargando ? (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <EstadoVacio
            titulo={ficha.noExiste ? 'Esta marca no existe' : 'No pudimos traer la marca'}
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
      titulo="Editar marca"
      descripcion="Lo que dejes vacío se borra."
      ancho="formulario"
      onVolver={volver}
      labelVolver="Marca"
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
            returnKeyType="next"
          />
          <CampoControlado
            control={form.control}
            name="direccion"
            label="Dirección"
            returnKeyType="next"
          />
          <CampoControlado
            control={form.control}
            name="telefono"
            label="Teléfono"
            keyboardType="phone-pad"
            returnKeyType="next"
          />
          <CampoControlado
            control={form.control}
            name="colorPrimario"
            label="Color primario"
            placeholder="#4A1866"
            helperText="Vacío = los colores de la app."
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={7}
            returnKeyType="next"
          />
          <CampoControlado
            control={form.control}
            name="colorSecundario"
            label="Color secundario"
            placeholder="#F2C14E"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={7}
            returnKeyType="done"
            onSubmitEditing={enviar}
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
