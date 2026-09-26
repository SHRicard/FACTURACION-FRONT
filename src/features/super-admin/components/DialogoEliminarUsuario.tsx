import { StyleSheet, View } from 'react-native';

import { Button, InputField, Modal, Text } from '@/shared/ui/atoms';
import { contar, formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { PALABRA_ELIMINAR } from '../schemas';
import type { DetallesUnicoDueno } from '../types';

interface DialogoEliminarUsuarioProps {
  visible: boolean;
  nombre: string;
  /**
   * `null` = primer freno (escribir la palabra). Con la marca = segundo freno:
   * es su unico dueno y borrarlo se lleva la marca entera.
   */
  marca: DetallesUnicoDueno['marca'] | null;
  confirmacion: string;
  onEscribir: (texto: string) => void;
  eliminando: boolean;
  error?: string | null;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * La baja de una cuenta, con los dos frenos del contrato (docs/SUPER_ADMIN.md,
 * 5.7): escribir ELIMINAR y, si es el unico dueno de su marca, un segundo
 * dialogo que dice con numeros lo que se pierde. No hay borrado a un toque.
 */
export function DialogoEliminarUsuario({
  visible,
  nombre,
  marca,
  confirmacion,
  onEscribir,
  eliminando,
  error,
  onConfirmar,
  onCancelar,
}: DialogoEliminarUsuarioProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const escrita = confirmacion.trim().toUpperCase() === PALABRA_ELIMINAR;

  return (
    <Modal
      visible={visible}
      onClose={onCancelar}
      titulo={marca ? `Se borra también "${marca.nombre}"` : `Eliminar a ${nombre}`}
      cerrarAlTocarFondo={!eliminando}
      acciones={
        <>
          <Button label="Cancelar" variant="ghost" onPress={onCancelar} disabled={eliminando} />
          <Button
            label={marca ? 'Borrar cuenta y marca' : 'Eliminar'}
            variant="danger"
            onPress={onConfirmar}
            loading={eliminando}
            disabled={!marca && !escrita}
          />
        </>
      }
    >
      <View style={styles.cuerpo}>
        {marca ? (
          <Text variant="body" tone="muted">
            Es el único dueño. Se van a borrar{' '}
            {contar(marca.estadisticas.cantidadClientes, 'cliente', 'clientes')} y{' '}
            {formatearMoneda(marca.estadisticas.deudaPendiente)} de deuda anotada, con todas sus
            facturas, tickets y pagos.
          </Text>
        ) : (
          <Text variant="body" tone="muted">
            Se borra la cuenta. Si su marca tiene otros dueños, la marca y sus datos quedan para
            ellos.
          </Text>
        )}

        <Text variant="body" weight="bold" tone="error">
          No se puede deshacer.
        </Text>

        {marca ? (
          error ? (
            <Text variant="caption" tone="error">
              {error}
            </Text>
          ) : null
        ) : (
          <InputField
            label={`Escribí ${PALABRA_ELIMINAR} para confirmar`}
            value={confirmacion}
            onChangeText={onEscribir}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={PALABRA_ELIMINAR}
            returnKeyType="done"
            error={error ?? undefined}
          />
        )}
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    cuerpo: { gap: theme.spacing.md },
  });
