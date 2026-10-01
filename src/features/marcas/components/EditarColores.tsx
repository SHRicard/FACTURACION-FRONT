import { Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

import { Button, Modal, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import type { useColoresMarca } from '../hooks/useMiMarca';

import { CampoColores } from './CampoColores';

interface EditarColoresProps {
  nombreMarca: string;
  edicion: ReturnType<typeof useColoresMarca>;
}

/**
 * Cuanto de la pantalla puede ocupar el contenido. El Modal no hace scroll: las
 * combinaciones, los campos y la vista previa no entran enteros en un telefono
 * chico, asi que el contenido lleva su propio ScrollView.
 */
const ALTO_MAXIMO_RELATIVO = 0.55;

/** El modal de los colores, desde Mi marca. */
export function EditarColores({ nombreMarca, edicion }: EditarColoresProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { height } = useWindowDimensions();

  return (
    <Modal
      visible={edicion.abierto}
      onClose={edicion.cerrar}
      titulo="Colores de tu factura"
      descripcion="Los ve tu cliente en el PDF: el nombre, el saldo y la barra de lo que pagó."
      acciones={
        <>
          <Button label="Cancelar" variant="ghost" onPress={edicion.cerrar} />
          <Button label="Guardar" loading={edicion.guardando} onPress={edicion.guardar} />
        </>
      }
    >
      <ScrollView
        style={{ maxHeight: height * ALTO_MAXIMO_RELATIVO }}
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <CampoColores nombreMarca={nombreMarca} colores={edicion.colores} />

        {edicion.error ? (
          <Text variant="caption" tone="error">
            {edicion.error}
          </Text>
        ) : null}

        {edicion.sinColores ? null : (
          <Pressable
            onPress={edicion.usarLosDeLaApp}
            disabled={edicion.guardando}
            accessibilityRole="button"
            hitSlop={theme.spacing.xs}
            style={styles.volver}
          >
            <Text variant="caption" weight="bold" tone="muted">
              Volver a los colores de la app
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    contenido: { gap: theme.spacing.md },
    volver: { alignSelf: 'center', minHeight: 32, justifyContent: 'center' },
  });
