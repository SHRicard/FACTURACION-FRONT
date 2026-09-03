import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

type EnlaceAuthProps = {
  href: Href;
  label: string;
};

/** Link de texto entre pantallas de auth, con touch target accesible (44pt). */
export function EnlaceAuth({ href, label }: EnlaceAuthProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Link href={href} asChild>
      <Pressable style={styles.zona} accessibilityRole="link" accessibilityLabel={label}>
        <Text variant="body" weight="medium" tone="primary" center>
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    zona: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.sm,
    },
  });
