import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { InputField, type InputFieldProps } from '@/shared/ui/atoms';

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
 * cada campo. Vive en la feature (no en shared/) por la regla de promocion:
 * si una segunda feature lo necesita, recien ahi sube a shared/ui/atoms.
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
