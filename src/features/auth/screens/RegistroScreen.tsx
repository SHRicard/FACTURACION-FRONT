import { Button, CampoControlado } from '@/shared/ui/atoms';

import {
  AceptoTerminos,
  AuthLayout,
  BotonGoogle,
  ConsentimientoGoogle,
  EnlaceAuth,
} from '../components';
import { useLoginGoogle, useRegistro } from '../hooks';

/**
 * Pantalla de creacion de cuenta. Al registrarse, la sesion queda abierta.
 *
 * La casilla de los terminos gobierna los DOS caminos de alta: el formulario y
 * Google. Sin tildarla no se crea nada, y arranca sin tildar.
 */
export function RegistroScreen() {
  const { form, enviar, cargando, error, terminos } = useRegistro();
  // El mismo endpoint sirve para registrarse: si la cuenta no existe, la crea.
  // Por eso se le pasa la casilla de esta pantalla.
  const google = useLoginGoogle({ acepto: terminos.acepto });

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

      <AceptoTerminos
        valor={terminos.acepto}
        onCambiar={terminos.cambiar}
        error={terminos.error}
        deshabilitado={cargando || google.cargando}
      />

      <Button
        label="Crear cuenta"
        onPress={enviar}
        loading={cargando}
        // Deshabilitado hasta que tilde: Google lo mira, y ademas evita un
        // viaje al backend que ya sabemos que va a responder 400.
        disabled={!terminos.acepto || google.cargando}
        fullWidth
        size="lg"
      />

      {google.disponible ? (
        <>
          <BotonGoogle
            onPress={google.entrar}
            cargando={google.cargando}
            deshabilitado={cargando || !terminos.acepto}
            error={google.error}
          />
          {/*
            Aca la casilla de arriba ya viajo tildada, asi que el backend no
            deberia pedir nada mas. El dialogo queda igual: si alguna vez lo
            pide, sin el la persona toca Google y no pasa nada.
          */}
          <ConsentimientoGoogle
            visible={google.consentimiento.visible}
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
