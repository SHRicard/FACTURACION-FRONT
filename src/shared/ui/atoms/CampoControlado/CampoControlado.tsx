import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { InputField } from '../InputField';
import type { InputFieldProps } from '../InputField';

type CampoControladoProps<T extends FieldValues> = Omit<
  InputFieldProps,
  'value' | 'onChangeText' | 'onBlur' | 'error'
> & {
  control: Control<T>;
  name: Path<T>;
};

/**
 * Puente entre React Hook Form y el atom `InputField`.
 *
 * Existe para que las pantallas no repitan el `<Controller render={...}>` en
 * cada campo. Empezo dentro de auth y subio aca cuando el alta de clientes lo
 * necesito: es la regla de promocion del design system.
 */
export function CampoControlado<T extends FieldValues>({
  control,
  name,
  ...rest
}: CampoControladoProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <InputField
          value={value ?? ''}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          {...rest}
        />
      )}
    />
  );
}
