import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Pestanas } from '@/features/metricas/components';
import type { Opcion } from '@/features/metricas/types';
import { Button, CampoControlado, Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { useCrearUsuario } from '../../hooks';
import type { CrearUsuarioForm } from '../../types';

const ROLES: readonly Opcion<CrearUsuarioForm['rol']>[] = [
  { clave: 'administrador', etiqueta: 'Administrador' },
  { clave: 'super_admin', etiqueta: 'Super admin' },
];

/**
 * Alta de una cuenta. La persona entra con este email y contraseña, acepta
 * los términos la primera vez y sigue el onboarding como cualquiera.
 */
export function CrearUsuarioMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { form, enviar, cargando, error, rol, elegirRol } = useCrearUsuario();
  const { control } = form;

  return (
    <Pantalla
      titulo="Crear cuenta"
      descripcion="Nace sin términos aceptados: los acepta al entrar."
      onVolver={() => router.back()}
      labelVolver="Usuarios"
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
            control={control}
            name="nombre"
            label="Nombre"
            required
            placeholder="Dani Pérez"
            autoCapitalize="words"
            returnKeyType="next"
          />
          <CampoControlado
            control={control}
            name="email"
            label="Email"
            required
            placeholder="dani@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <CampoControlado
            control={control}
            name="password"
            label="Contraseña"
            required
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="next"
          />
          <CampoControlado
            control={control}
            name="dni"
            label="DNI"
            placeholder="30111555"
            helperText="Opcional. Si no lo cargás, lo pide al entrar."
            keyboardType="number-pad"
            returnKeyType="done"
          />

          <View style={styles.rol}>
            <Text variant="caption" weight="medium">
              Rol
            </Text>
            <Pestanas opciones={ROLES} activa={rol} onCambiar={elegirRol} />
            {rol === 'super_admin' ? (
              <Text variant="caption" tone="warning">
                Un super admin ve y toca toda la plataforma. No opera un negocio.
              </Text>
            ) : null}
          </View>

          <Button label="Crear cuenta" onPress={enviar} loading={cargando} fullWidth />
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    teclado: { flex: 1 },
    scroll: { gap: theme.spacing.md, paddingBottom: theme.spacing.xl },
    rol: { gap: theme.spacing.xs },
  });
