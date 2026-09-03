import { forwardRef, memo, useCallback, useMemo, useState } from 'react';
import { TextInput, View, type TextInput as TextInputRef } from 'react-native';

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
  { hasError = false, disabled = false, leftSlot, rightSlot, onFocus, onBlur, ...rest },
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

  return (
    <View
      style={[
        styles.container,
        enfocado && !hasError && styles.focused,
        hasError && styles.error,
        disabled && styles.disabled,
      ]}
    >
      {leftSlot}
      <TextInput
        ref={ref}
        editable={!disabled}
        style={styles.input}
        placeholderTextColor={theme.colors.textMuted}
        onFocus={alEnfocar}
        onBlur={alDesenfocar}
        accessibilityState={{ disabled }}
        {...rest}
      />
      {rightSlot}
    </View>
  );
});

export const Input = memo(InputComponent);
