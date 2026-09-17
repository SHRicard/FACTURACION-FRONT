import { StyleSheet, View } from 'react-native';

import { Button, Modal, SelectorFecha, Text } from '@/shared/ui/atoms';
import { formatearFecha, hoyEnArgentina } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { useReprogramarVencimiento } from '../hooks/useReprogramarVencimiento';

interface CambiarVencimientoProps {
  reprogramacion: ReturnType<typeof useReprogramarVencimiento>;
  /** Contra esta se sigue midiendo el cumplimiento, se cambie o no la fecha. */
  vencimientoOriginal?: string | null;
}

/**
 * "Te pago el 30": el calendario para mover el vencimiento de la factura en
 * curso.
 *
 * Avisa ANTES de guardar que el cumplimiento no cambia: la factura deja de
 * figurar vencida hasta la fecha nueva, pero el atraso contra la original
 * sigue contando.
 */
export function CambiarVencimiento({
  reprogramacion,
  vencimientoOriginal,
}: CambiarVencimientoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const original = formatearFecha(vencimientoOriginal);

  return (
    <Modal
      visible={reprogramacion.abierto}
      onClose={reprogramacion.cerrar}
      titulo="Cambiar la fecha"
      descripcion="El día que acordaste con el cliente. Hasta esa fecha deja de figurar vencida."
      acciones={
        <>
          <Button label="Cancelar" variant="ghost" onPress={reprogramacion.cerrar} />
          <Button
            label="Guardar fecha"
            onPress={reprogramacion.guardar}
            disabled={!reprogramacion.fecha}
            loading={reprogramacion.guardando}
          />
        </>
      }
    >
      <View style={styles.contenido}>
        <SelectorFecha
          valor={reprogramacion.fecha}
          onCambiar={reprogramacion.setFecha}
          minimo={hoyEnArgentina()}
          accessibilityLabel="Nueva fecha de vencimiento"
        />
        <Text variant="caption" tone="muted">
          {original
            ? `El cumplimiento se sigue midiendo contra el ${original}: cambiar la fecha no le borra el atraso.`
            : 'El cumplimiento se sigue midiendo contra la fecha original: cambiar la fecha no le borra el atraso.'}
        </Text>
        {reprogramacion.error ? (
          <Text variant="caption" tone="error">
            {reprogramacion.error}
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    contenido: { gap: theme.spacing.sm },
  });
