import { StyleSheet } from 'react-native';

import type { Theme } from '@/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      minHeight: 44, // touch target accesible
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    fullWidth: { alignSelf: 'stretch' },

    // tamanos
    sm: { minHeight: 44, paddingHorizontal: theme.spacing.md },
    md: { minHeight: 48, paddingHorizontal: theme.spacing.lg },
    lg: { minHeight: 56, paddingHorizontal: theme.spacing.xl },

    smLabel: { fontSize: theme.typography.size.caption },
    mdLabel: { fontSize: theme.typography.size.body },
    lgLabel: { fontSize: theme.typography.size.body },

    // variantes: fondo
    primary: { backgroundColor: theme.colors.primary },
    secondary: { backgroundColor: 'transparent', borderColor: theme.colors.primary },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: theme.colors.error },

    // variantes: color del texto
    primaryLabel: { color: theme.colors.onPrimary },
    secondaryLabel: { color: theme.colors.primary },
    ghostLabel: { color: theme.colors.primary },
    dangerLabel: { color: theme.colors.onPrimary },

    // El token trae familia y, en web, tambien el peso.
    label: { ...theme.typography.family.text.bold },

    // estados
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.85 },
  });
