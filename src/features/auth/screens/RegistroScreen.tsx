import { Button, CampoControlado } from '@/shared/ui/atoms';

import { AuthLayout, BotonGoogle, EnlaceAuth } from '../components';
import { useLoginGoogle, useRegistro } from '../hooks';

/** Pantalla de creacion de cuenta. Al registrarse, la sesion queda abierta. */
export function RegistroScreen() {
  const { form, enviar, cargando, error } = useRegistro();
  // El mismo endpoint sirve para registrarse: si la cuenta no existe, la crea.
  const google = useLoginGoogle();

  return (
    <AuthLayout
      titulo="Crear cuenta"
      subtitulo="Completa tus datos para empezar a facturar."
      error={error}
      footer={<EnlaceAuth href="/login" label="Ya tenes cuenta? Inicia sesion" />}
    >
      <CampoControlado
        control={form.control}
        name="nombre"
        label="Nombre"
        required
        placeholder="Tu nombre completo"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
      />

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
        placeholder="Minimo 6 caracteres"
        helperText="Al menos 6 caracteres."
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
      />

      <CampoControlado
        control={form.control}
        name="confirmarPassword"
        label="Repetir contrasena"
        required
        placeholder="Escribila de nuevo"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={enviar}
      />

      <Button
        label="Crear cuenta"
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
