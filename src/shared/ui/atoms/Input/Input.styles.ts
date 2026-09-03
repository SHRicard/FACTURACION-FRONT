import { StyleSheet } from 'react-native';

import type { Theme } from '@/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    input: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.size.body,
      color: theme.colors.text,
    },
    focused: { borderColor: theme.colors.primary },
    error: { borderColor: theme.colors.error },
    disabled: { opacity: 0.5 },
  });
