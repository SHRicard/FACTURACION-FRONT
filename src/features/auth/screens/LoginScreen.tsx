import { Button, CampoControlado } from '@/shared/ui/atoms';

import { AuthLayout, BotonGoogle, EnlaceAuth } from '../components';
import { useLogin, useLoginGoogle } from '../hooks';

/**
 * Pantalla de inicio de sesion.
 * Sin logica de negocio: todo sale de `useLogin`.
 */
export function LoginScreen() {
  const { form, enviar, cargando, error } = useLogin();
  const google = useLoginGoogle();

  return (
    <AuthLayout
      titulo="Iniciar sesion"
      subtitulo="Entra con tu cuenta para gestionar tu facturacion."
      error={error}
      footer={
        <>
          <EnlaceAuth href="/recuperar-password" label="Olvidaste tu contrasena?" />
          <EnlaceAuth href="/registro" label="No tenes cuenta? Registrate" />
        </>
      }
    >
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
        <BotonGoogle
          onPress={google.entrar}
          cargando={google.cargando}
          deshabilitado={cargando}
          error={google.error}
        />
      ) : null}
    </AuthLayout>
  );
}
