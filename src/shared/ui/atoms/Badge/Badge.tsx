import { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Text } from '@/shared/ui/atoms/Text';
import { useTheme } from '@/theme';

import { createStyles } from './Badge.styles';
import type { BadgeProps, BadgeTone } from './Badge.types';

/** Mapea el tono del badge al tono del texto, para no repetir el switch. */
const TONO_TEXTO = {
  neutral: 'muted',
  primary: 'primary',
  success: 'success',
  error: 'error',
  warning: 'warning',
} as const satisfies Record<BadgeTone, string>;

function BadgeComponent({ label, tone = 'neutral' }: BadgeProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.base, styles[tone]]} accessible accessibilityRole="text">
      <Text variant="caption" weight="medium" tone={TONO_TEXTO[tone]}>
        {label}
      </Text>
    </View>
  );
}

export const Badge = memo(BadgeComponent);
