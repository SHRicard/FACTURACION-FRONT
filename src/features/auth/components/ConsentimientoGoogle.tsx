import { StyleSheet, View } from 'react-native';

import { Button, Modal, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { AceptoTerminos } from './AceptoTerminos';

interface ConsentimientoGoogleProps {
  visible: boolean;
  valor: boolean;
  onCambiar: (valor: boolean) => void;
  onAceptar: () => void;
  onCancelar: () => void;
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
  cargando,
  error,
}: ConsentimientoGoogleProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      onClose={onCancelar}
      titulo="Antes de crear tu cuenta"
      descripcion="Es la primera vez que entrás con esta cuenta de Google."
      acciones={
        <>
          <Button label="Cancelar" variant="ghost" onPress={onCancelar} />
          <Button label="Crear cuenta" onPress={onAceptar} loading={cargando} disabled={!valor} />
        </>
      }
    >
      <View style={styles.cuerpo}>
        <AceptoTerminos valor={valor} onCambiar={onCambiar} deshabilitado={cargando} />
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
    cuerpo: { gap: theme.spacing.sm },
  });
