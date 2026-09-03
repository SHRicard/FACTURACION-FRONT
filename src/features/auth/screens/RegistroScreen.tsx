import { Button } from '@/shared/ui/atoms';

import { AuthLayout, CampoControlado, EnlaceAuth } from '../components';
import { useRegistro } from '../hooks';

/** Pantalla de creacion de cuenta. Al registrarse, la sesion queda abierta. */
export function RegistroScreen() {
  const { form, enviar, cargando, error } = useRegistro();

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
        placeholder="Minimo 8 caracteres"
        helperText="Al menos 8 caracteres, con mayuscula, minuscula y numero."
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

      <Button label="Crear cuenta" onPress={enviar} loading={cargando} fullWidth size="lg" />
    </AuthLayout>
  );
}
