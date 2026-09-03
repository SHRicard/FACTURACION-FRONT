import { X } from 'lucide-react-native';
import { memo, useMemo } from 'react';
import { KeyboardAvoidingView, Modal as RNModal, Platform, Pressable, View } from 'react-native';

import { Text } from '@/shared/ui/atoms/Text';
import { useTheme } from '@/theme';

import { createStyles } from './Modal.styles';
import type { ModalProps } from './Modal.types';

/**
 * Dialogo centrado sobre un fondo oscurecido.
 *
 * Se apoya en el `Modal` nativo de React Native: no suma dependencias y respeta
 * las convenciones de cada plataforma (en Android, el boton fisico de atras lo
 * cierra via `onRequestClose`, que RN exige justamente por eso).
 *
 * Es un atom: no sabe nada del dominio. El estado `visible` lo maneja quien lo usa.
 */
function ModalComponent({
  visible,
  onClose,
  titulo,
  descripcion,
  children,
  acciones,
  cerrarAlTocarFondo = true,
  mostrarCerrar = true,
}: ModalProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      // Boton atras de Android. RN lo pide siempre en Android.
      onRequestClose={onClose}
      // Para que el velo cubra tambien la barra de estado.
      statusBarTranslucent
    >
      <View style={styles.raiz}>
        {/* Velo: hermano absoluto DETRAS de la tarjeta (ver Modal.styles.ts). */}
        <Pressable
          style={styles.velo}
          onPress={cerrarAlTocarFondo ? onClose : undefined}
          // Es decorativo: no debe anunciarse como boton.
          accessible={false}
          importantForAccessibility="no"
        />

        <KeyboardAvoidingView
          style={styles.contenedor}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={styles.tarjeta}
            // Aisla el modal del resto de la pantalla para el lector de pantalla.
            accessibilityViewIsModal
            accessibilityLabel={titulo}
          >
            {titulo || mostrarCerrar ? (
              <View style={styles.encabezado}>
                <View style={styles.textoEncabezado}>
                  {titulo ? (
                    <Text variant="title" weight="bold" accessibilityRole="header">
                      {titulo}
                    </Text>
                  ) : null}
                  {descripcion ? (
                    <Text variant="body" tone="muted">
                      {descripcion}
                    </Text>
                  ) : null}
                </View>

                {mostrarCerrar ? (
                  <Pressable
                    onPress={onClose}
                    style={styles.cerrar}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar"
                  >
                    <X size={20} color={theme.colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {children}

            {acciones ? <View style={styles.acciones}>{acciones}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
}

export const Modal = memo(ModalComponent);
