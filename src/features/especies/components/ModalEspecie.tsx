import { StyleSheet, View } from 'react-native';

import { Button, CampoControlado, Modal, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import type { useGuardarEspecie } from '../hooks';

/**
 * Alta y edicion de una especie. Un modal alcanza: son dos campos.
 *
 * Recibe el hook entero en vez de diez props sueltas: el formulario, el estado
 * de guardado y el abrir/cerrar son una sola cosa y separarlos solo agregaria
 * ruido.
 */
export function ModalEspecie({ guardar }: { guardar: ReturnType<typeof useGuardarEspecie> }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Modal
      visible={guardar.abierto}
      onClose={guardar.cerrar}
      titulo={guardar.esEdicion ? 'Editar especie' : 'Nueva especie'}
      descripcion={
        guardar.esEdicion
          ? 'Se manda solo lo que cambies.'
          : 'El tipo de mercadería: Pantalón, Zapatilla, Media.'
      }
      acciones={
        <>
          <Button label="Cancelar" variant="ghost" onPress={guardar.cerrar} />
          <Button
            label={guardar.esEdicion ? 'Guardar' : 'Crear'}
            loading={guardar.guardando}
            onPress={guardar.enviar}
          />
        </>
      }
    >
      <View style={styles.campos}>
        <CampoControlado
          control={guardar.form.control}
          name="nombre"
          label="Nombre"
          required
          placeholder="Pantalón"
          autoCapitalize="sentences"
          returnKeyType="next"
          // Renombrar no reescribe los tickets viejos: cada item guardo el
          // nombre que la especie tenia ese dia. Conviene decirlo antes de que
          // alguien renombre esperando que cambie el historial.
          helperText={
            guardar.esEdicion ? 'Los tickets ya emitidos conservan el nombre anterior.' : undefined
          }
        />
        <CampoControlado
          control={guardar.form.control}
          name="descripcion"
          label="Descripción"
          placeholder="Largos y de vestir"
          helperText="Opcional. Para acordarte qué entra en este tipo."
          autoCapitalize="sentences"
          returnKeyType="done"
          onSubmitEditing={guardar.enviar}
        />

        {guardar.error ? (
          <Text variant="caption" tone="error">
            {guardar.error}
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    campos: { gap: theme.spacing.md },
  });
