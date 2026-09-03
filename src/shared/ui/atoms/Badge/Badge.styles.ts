import { StyleSheet } from 'react-native';

import type { Theme } from '@/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.full,
      borderWidth: 1,
    },
    neutral: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
    primary: { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary },
    success: { backgroundColor: theme.colors.surface, borderColor: theme.colors.success },
    error: { backgroundColor: theme.colors.surface, borderColor: theme.colors.error },
    warning: { backgroundColor: theme.colors.surface, borderColor: theme.colors.warning },
  });
