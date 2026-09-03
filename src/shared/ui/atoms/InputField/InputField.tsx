import { AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import { forwardRef, memo, useCallback, useMemo, useState } from 'react';
import { Pressable, View, type TextInput as TextInputRef } from 'react-native';

import { Input } from '@/shared/ui/atoms/Input';
import { Text } from '@/shared/ui/atoms/Text';
import { useTheme } from '@/theme';

import { createStyles } from './InputField.styles';
import type { InputFieldProps } from './InputField.types';

/**
 * Campo de formulario completo: label + Input + error/ayuda.
 *
 * Es un atom (y no una molecule) por la regla del proyecto: lo usa TODA la app
 * y no sabe nada del dominio. Recibe el error ya resuelto por props; no valida.
 */
const InputFieldComponent = forwardRef<TextInputRef, InputFieldProps>(function InputField(
  { label, error, helperText, required = false, secureTextEntry, ...rest },
  ref,
) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [oculto, setOculto] = useState(Boolean(secureTextEntry));

  const alternarVisibilidad = useCallback(() => setOculto((v) => !v), []);

  const esPassword = Boolean(secureTextEntry);
  const hayError = Boolean(error);

  return (
    <View style={styles.container}>
      <Text variant="caption" weight="medium" tone={hayError ? 'error' : 'muted'}>
        {label}
        {required ? ' *' : ''}
      </Text>

      <Input
        ref={ref}
        hasError={hayError}
        secureTextEntry={esPassword && oculto}
        accessibilityLabel={label}
        // El lector de pantalla tiene que enterarse del error, no solo verlo.
        accessibilityHint={error ?? helperText}
        rightSlot={
          esPassword ? (
            <Pressable
              onPress={alternarVisibilidad}
              style={styles.toggle}
              accessibilityRole="button"
              accessibilityLabel={oculto ? 'Mostrar contrasena' : 'Ocultar contrasena'}
              accessibilityState={{ selected: !oculto }}
            >
              {oculto ? (
                <EyeOff size={20} color={theme.colors.textMuted} />
              ) : (
                <Eye size={20} color={theme.colors.textMuted} />
              )}
            </Pressable>
          ) : undefined
        }
        {...rest}
      />

      {/* El error lleva icono ademas de color: no se comunica solo con color. */}
      {hayError ? (
        <View style={styles.mensajeFila}>
          <AlertCircle size={14} color={theme.colors.error} />
          <Text variant="caption" tone="error">
            {error}
          </Text>
        </View>
      ) : helperText ? (
        <Text variant="caption" tone="muted">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});

export const InputField = memo(InputFieldComponent);
