import { StyleSheet, View } from 'react-native';

import { AvatarIniciales } from '@/features/marcas/components';
import { Badge, Button, Text } from '@/shared/ui/atoms';
import { conPuntos } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { haceCuanto } from '../formato';
import type { DuenoAdmin } from '../types';

interface FilaDuenoAdminProps {
  dueno: DuenoAdmin;
  /** Tocar el nombre abre la ficha de la cuenta. */
  onAbrir?: (id: string) => void;
  /** Sin esto no aparece "Sacar": el ultimo dueno no se puede sacar. */
  onSacar?: (dueno: DuenoAdmin) => void;
}

/** Un dueno de una marca, visto desde el panel: con su DNI y su ultimo acceso. */
export function FilaDuenoAdmin({ dueno, onAbrir, onSacar }: FilaDuenoAdminProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const acceso = haceCuanto(dueno.ultimoAcceso);
  const secundario = [
    dueno.dni ? `DNI ${conPuntos(dueno.dni)}` : null,
    dueno.email,
    acceso ? `entró ${acceso}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.fila}>
      <AvatarIniciales nombre={dueno.nombre} imagen={dueno.avatar ?? undefined} />
      <View style={styles.textos}>
        <View style={styles.nombre}>
          <Text
            variant="body"
            weight="medium"
            tone={onAbrir ? 'primary' : 'default'}
            numberOfLines={1}
            style={styles.flexible}
            onPress={onAbrir ? () => onAbrir(dueno.id) : undefined}
            accessibilityRole={onAbrir ? 'link' : undefined}
          >
            {dueno.nombre}
          </Text>
          {dueno.suspendida ? <Badge label="Suspendida" tone="error" /> : null}
        </View>
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {secundario}
        </Text>
      </View>
      {onSacar ? (
        <Button label="Sacar" variant="ghost" size="sm" onPress={() => onSacar(dueno)} />
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    textos: { flex: 1, gap: 2 },
    nombre: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    flexible: { flexShrink: 1 },
  });
