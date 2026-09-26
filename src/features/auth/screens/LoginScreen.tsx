import { Button, CampoControlado, Text } from '@/shared/ui/atoms';

import { AuthLayout, BotonGoogle, ConsentimientoGoogle, EnlaceAuth } from '../components';
import { useLogin, useLoginGoogle } from '../hooks';

/**
 * Pantalla de inicio de sesion.
 * Sin logica de negocio: todo sale de `useLogin`.
 */
export function LoginScreen() {
  const { form, enviar, cargando, error, pistaGoogle } = useLogin();
  const google = useLoginGoogle();

  return (
    <AuthLayout
      logo
      titulo="Iniciar sesion"
      subtitulo="Entra con tu cuenta para gestionar tu facturacion."
      error={error}
      footer={
        <>
          <EnlaceAuth href="/recuperar-password" label="Olvidaste tu contrasena?" />
          <EnlaceAuth href="/registro" label="No tenes cuenta? Registrate" />
          {/* Los avisos se leen sin sesión: a quien no puede entrar (un
              mantenimiento) le sirve saber por qué. */}
          <EnlaceAuth href="/avisos" label="Ver avisos de la app" />
        </>
      }
    >
      {/* Va primero: queda justo debajo del cartel de error. */}
      {pistaGoogle ? (
        <Text variant="caption" tone="muted">
          ¿Te registraste con Google? Tocá «Continuar con Google».
        </Text>
      ) : null}

      <CampoControlado
        control={form.control}
        name="email"
        label="Email"
        required
        placeholder="tu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />

      <CampoControlado
        control={form.control}
        name="password"
        label="Contrasena"
        required
        placeholder="Tu contrasena"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={enviar}
      />

      <Button
        label="Ingresar"
        onPress={enviar}
        loading={cargando}
        disabled={google.cargando}
        fullWidth
        size="lg"
      />

      {google.disponible ? (
        <>
          <BotonGoogle
            onPress={google.entrar}
            cargando={google.cargando}
            deshabilitado={cargando}
            error={google.error}
          />
          {/*
            Entrar con Google tambien crea la cuenta si no existe, y eso no
            puede pasar sin consentimiento. Quien ya tiene cuenta entra derecho
            y nunca ve este dialogo.
          */}
          <ConsentimientoGoogle
            visible={google.consentimiento.visible}
            cuenta={google.consentimiento.cuenta}
            valor={google.consentimiento.acepto}
            onCambiar={google.consentimiento.cambiar}
            onAceptar={google.consentimiento.confirmar}
            onCancelar={google.consentimiento.cancelar}
            cargando={google.consentimiento.cargando}
            error={google.consentimiento.error}
          />
        </>
      ) : null}
    </AuthLayout>
  );
}
