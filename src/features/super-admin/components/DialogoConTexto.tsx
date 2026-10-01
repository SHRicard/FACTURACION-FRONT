import { StyleSheet, View, type KeyboardTypeOptions } from 'react-native';

import { Button, InputField, Modal, type ButtonVariant } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface DialogoConTextoProps {
  visible: boolean;
  titulo: string;
  descripcion?: string;
  /** Etiqueta del campo. */
  label: string;
  placeholder?: string;
  helperText?: string;
  valor: string;
  onCambiar: (texto: string) => void;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  confirmar: string;
  variante?: ButtonVariant;
  /** Mientras sea false, el boton de confirmar no se puede tocar. */
  puedeConfirmar?: boolean;
  cargando: boolean;
  error?: string | null;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Una confirmacion que pide un dato: el motivo de una suspension, el DNI del
 * dueno a sumar. El estado lo maneja el hook de la pantalla; esto solo dibuja.
 */
export function DialogoConTexto({
  visible,
  titulo,
  descripcion,
  label,
  placeholder,
  helperText,
  valor,
  onCambiar,
  keyboardType,
  maxLength,
  confirmar,
  variante = 'primary',
  puedeConfirmar = true,
  cargando,
  error,
  onConfirmar,
  onCancelar,
}: DialogoConTextoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      onClose={onCancelar}
      titulo={titulo}
      descripcion={descripcion}
      // Mientras manda, un toque en el fondo no puede cerrar el dialogo.
      cerrarAlTocarFondo={!cargando}
      acciones={
        <>
          <Button label="Cancelar" variant="ghost" onPress={onCancelar} disabled={cargando} />
          <Button
            label={confirmar}
            variant={variante}
            onPress={onConfirmar}
            loading={cargando}
            disabled={!puedeConfirmar}
          />
        </>
      }
    >
      <View style={styles.cuerpo}>
        <InputField
          label={label}
          value={valor}
          onChangeText={onCambiar}
          placeholder={placeholder}
          helperText={helperText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={puedeConfirmar ? onConfirmar : undefined}
          error={error ?? undefined}
        />
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    cuerpo: { gap: theme.spacing.md },
  });
