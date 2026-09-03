import { StyleSheet } from 'react-native';

import type { Theme } from '@/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // tamanos
    caption: { fontSize: theme.typography.size.caption },
    body: { fontSize: theme.typography.size.body },
    title: { fontSize: theme.typography.size.title },
    heading: { fontSize: theme.typography.size.heading },

    // Fuentes: el token ya trae familia y, solo en web, el peso.
    textRegular: { ...theme.typography.family.text.regular },
    textMedium: { ...theme.typography.family.text.medium },
    textBold: { ...theme.typography.family.text.bold },
    displayRegular: { ...theme.typography.family.display.regular },
    displayMedium: { ...theme.typography.family.display.medium },
    displayBold: { ...theme.typography.family.display.bold },

    // tonos (solo tokens semanticos)
    default: { color: theme.colors.text },
    muted: { color: theme.colors.textMuted },
    primary: { color: theme.colors.primary },
    onPrimary: { color: theme.colors.onPrimary },
    error: { color: theme.colors.error },
    success: { color: theme.colors.success },
    warning: { color: theme.colors.warning },

    center: { textAlign: 'center' },
  });
