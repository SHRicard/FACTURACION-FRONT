import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Modal, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { AceptoTerminos } from './AceptoTerminos';
import { LogoGoogle } from './LogoGoogle';

interface ConsentimientoGoogleProps {
  visible: boolean;
  valor: boolean;
  onCambiar: (valor: boolean) => void;
  onAceptar: () => void;
  onCancelar: () => void;
  /**
   * El mail de la cuenta de Google que se esta por dar de alta. Sin esto el
   * dialogo dice "esta cuenta de Google" sin decir cual, y en un telefono con
   * varias cuentas eso es justo el dato que falta para decidir.
   */
  cuenta?: string | null;
  cargando?: boolean;
  error?: string | null;
}

/**
 * La casilla de los terminos, cuando entrar con Google va a CREAR la cuenta.
 *
 * Desde el login no se sabe de antemano si la cuenta de Google existe, asi que
 * el primer intento va sin consentimiento: si el backend responde que falta
 * (400), es que la estaria creando, y recien ahi se pregunta. Quien ya tiene
 * cuenta entra derecho y nunca ve este dialogo.
 *
 * Cancelar no crea nada: el backend rechaza el alta antes de tocar la base.
 */
export function ConsentimientoGoogle({
  visible,
  valor,
  onCambiar,
  onAceptar,
  onCancelar,
  cuenta,
  cargando,
  error,
}: ConsentimientoGoogleProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      onClose={onCancelar}
      titulo="Antes de crear tu cuenta"
      // "de Google" lo dice el logo de la pastilla de abajo: repetirlo estiraba
      // la frase a dos renglones para no agregar nada.
      descripcion="Es la primera vez que entrás con esta cuenta."
      // La X hacia exactamente lo mismo que "Cancelar" y encima apretaba el
      // titulo contra el borde. Con dos botones abajo no hace falta.
      mostrarCerrar={false}
      // A lo ancho y apiladas, como los botones de las pantallas de auth que
      // quedan atras. Una fila de botones chicos a la derecha se leia como de
      // otra app.
      accionesApiladas
      acciones={
        <>
          <Button
            label="Crear cuenta"
            onPress={onAceptar}
            loading={cargando}
            disabled={!valor}
            fullWidth
            size="lg"
          />
          <Button
            label="Cancelar"
            variant="ghost"
            onPress={onCancelar}
            disabled={cargando}
            fullWidth
          />
        </>
      }
    >
      <View style={styles.cuerpo}>
        {cuenta ? (
          <View style={styles.cuenta}>
            <LogoGoogle size={18} />
            {/*
              El mail se trunca por el medio y no al final: la parte que
              identifica la cuenta es el principio, pero el dominio tambien
              importa cuando alguien tiene una personal y una del trabajo.
            */}
            <Text
              variant="caption"
              weight="medium"
              numberOfLines={1}
              ellipsizeMode="middle"
              style={styles.mail}
            >
              {cuenta}
            </Text>
          </View>
        ) : null}

        {/*
          La casilla va enmarcada. Suelta sobre el fondo del dialogo se leia
          como letra chica y no como el control que hay que tocar para seguir,
          que es justo lo que es: sin tildarla el boton queda apagado.
        */}
        <View style={[styles.consentimiento, error ? styles.conError : null]}>
          <AceptoTerminos valor={valor} onCambiar={onCambiar} deshabilitado={cargando} />
        </View>

        {error ? (
          <Text variant="caption" tone="error" accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    cuerpo: { gap: theme.spacing.md },
    cuenta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      // Que la pastilla mida lo que mide el mail, no todo el ancho.
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    mail: { flexShrink: 1 },
    consentimiento: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    // El borde acompana al texto rojo de abajo: el color no es el unico aviso.
    conError: { borderColor: theme.colors.error },
  });
