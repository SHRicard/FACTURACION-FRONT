import { forwardRef, memo, useCallback, useMemo, useState } from 'react';
import { TextInput, View, type TextInput as TextInputRef } from 'react-native';

import { Text } from '@/shared/ui/atoms/Text';
import { conPuntos, soloDigitos } from '@/shared/utils';
import { useTheme } from '@/theme';

import { createStyles } from './Input.styles';
import type { InputProps } from './Input.types';

/**
 * Campo de texto crudo. NO muestra label ni mensaje de error: de eso se ocupa
 * `InputField`. Este atom solo se ve y se comporta como un input.
 *
 * Lleva `forwardRef` para que un formulario pueda enfocar el campo siguiente
 * desde el boton "next" del teclado.
 */
const InputComponent = forwardRef<TextInputRef, InputProps>(function Input(
  {
    hasError = false,
    disabled = false,
    monto = false,
    leftSlot,
    rightSlot,
    onFocus,
    onBlur,
    value,
    onChangeText,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [enfocado, setEnfocado] = useState(false);

  const alEnfocar = useCallback<NonNullable<InputProps['onFocus']>>(
    (e) => {
      setEnfocado(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const alDesenfocar = useCallback<NonNullable<InputProps['onBlur']>>(
    (e) => {
      setEnfocado(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  /*
   * En un monto, los puntos se agregan al MOSTRAR y se sacan al ESCRIBIR: asi
   * el formulario y su schema siguen trabajando con digitos (`'2000000'`) y
   * nadie tiene que acordarse de limpiar puntos antes de mandar a la API.
   */
  const valorVisible = monto && value != null ? conPuntos(value) : value;
  const alCambiar = useCallback(
    (texto: string) => onChangeText?.(monto ? soloDigitos(texto) : texto),
    [monto, onChangeText],
  );

  return (
    <View
      style={[
        styles.container,
        enfocado && !hasError && styles.focused,
        hasError && styles.error,
        disabled && styles.disabled,
      ]}
    >
      {leftSlot ??
        (monto ? (
          // El signo adentro del campo evita tener que escribirlo y deja claro
          // que lo que va ahi es plata, no una cantidad.
          <Text variant="body" tone="muted">
            $
          </Text>
        ) : null)}
      <TextInput
        ref={ref}
        editable={!disabled}
        style={styles.input}
        placeholderTextColor={theme.colors.textMuted}
        onFocus={alEnfocar}
        onBlur={alDesenfocar}
        accessibilityState={{ disabled }}
        keyboardType={monto ? 'number-pad' : undefined}
        {...rest}
        value={valorVisible}
        onChangeText={alCambiar}
      />
      {rightSlot}
    </View>
  );
});

export const Input = memo(InputComponent);
