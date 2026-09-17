import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, InputField, Modal, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import type { CasoDeBaja } from '../hooks';
import { PALABRA_CONFIRMACION } from '../schemas';

interface DialogoEliminarCuentaProps {
  visible: boolean;
  caso: CasoDeBaja;
  cargandoCaso: boolean;
  confirmacion: string;
  onEscribir: (texto: string) => void;
  puedeEliminar: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  eliminando: boolean;
  error?: string | null;
}

/**
 * Que se borra en cada caso. Lo lee la persona antes de confirmar, asi que dice
 * las cosas por su nombre: "tus clientes", no "tus datos".
 */
const QUE_SE_BORRA: Record<CasoDeBaja, string> = {
  sola: 'Sos la única dueña de tu marca, así que se borra todo: tu cuenta, la marca con su logo, y los clientes, especies, tickets, facturas y pagos del negocio.',
  compartida:
    'Tu marca tiene otros dueños, así que el negocio queda para ellos. Se borra solo tu cuenta, y tu nombre desaparece de los tickets y pagos que registraste.',
  desconocido:
    'Se borra tu cuenta. Si sos la única dueña de tu marca, se borra también el negocio entero: clientes, especies, tickets, facturas y pagos.',
};

/**
 * La confirmacion en dos frenos de la baja de cuenta.
 *
 * Primero dice que se lleva puesto —que no es lo mismo si comparte la marca con
 * otros duenos—, y despues pide escribir la palabra. Lo que no puede existir es
 * un borrado a un solo toque: no se puede deshacer y no hay periodo de gracia.
 */
export function DialogoEliminarCuenta({
  visible,
  caso,
  cargandoCaso,
  confirmacion,
  onEscribir,
  puedeEliminar,
  onConfirmar,
  onCancelar,
  eliminando,
  error,
}: DialogoEliminarCuentaProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      onClose={onCancelar}
      titulo="Eliminar mi cuenta"
      // Mientras borra, un toque en el fondo no puede cerrar el dialogo.
      cerrarAlTocarFondo={!eliminando}
      acciones={
        <>
          <Button label="Cancelar" variant="ghost" onPress={onCancelar} />
          <Button
            label="Eliminar"
            variant="danger"
            onPress={onConfirmar}
            loading={eliminando}
            disabled={!puedeEliminar}
          />
        </>
      }
    >
      <View style={styles.cuerpo}>
        {cargandoCaso ? (
          <View style={styles.centro}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <Text variant="body" tone="muted">
            {QUE_SE_BORRA[caso]}
          </Text>
        )}

        <Text variant="body" weight="bold" tone="error">
          No se puede deshacer y no hay forma de recuperarlo.
        </Text>

        <InputField
          label={`Escribí ${PALABRA_CONFIRMACION} para confirmar`}
          value={confirmacion}
          onChangeText={onEscribir}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder={PALABRA_CONFIRMACION}
          returnKeyType="done"
          error={error ?? undefined}
        />
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    cuerpo: { gap: theme.spacing.md },
    centro: { paddingVertical: theme.spacing.md, alignItems: 'center' },
  });
