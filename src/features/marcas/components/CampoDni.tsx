import { IdCard } from 'lucide-react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { InputField } from '@/shared/ui/atoms';
import { conPuntos, soloDigitos } from '@/shared/utils';
import { useTheme } from '@/theme';

interface CampoDniProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  helperText?: string;
  onSubmitEditing?: () => void;
}

/**
 * El DNI con los puntos puestos mientras se escribe: `30.111.222`. Se lee y se
 * controla mucho mejor que ocho numeros pegados. Al formulario le llegan solo
 * los digitos, que es lo que valida el schema y lo que guarda el backend.
 */
export function CampoDni<T extends FieldValues>({
  control,
  name,
  label = 'DNI',
  helperText,
  onSubmitEditing,
}: CampoDniProps<T>) {
  const theme = useTheme();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <InputField
          label={label}
          required
          value={conPuntos(String(value ?? ''))}
          onChangeText={(texto) => onChange(soloDigitos(texto))}
          onBlur={onBlur}
          error={error?.message}
          helperText={helperText}
          placeholder="30.111.222"
          keyboardType="number-pad"
          // 8 digitos + 2 puntos.
          maxLength={10}
          returnKeyType="done"
          onSubmitEditing={onSubmitEditing}
          leftSlot={<IdCard size={18} color={theme.colors.textMuted} strokeWidth={1.9} />}
        />
      )}
    />
  );
}
