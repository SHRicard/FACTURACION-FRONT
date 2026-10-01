import { StyleSheet, View } from 'react-native';

import { Badge, Button, Text } from '@/shared/ui/atoms';
import { conPuntos } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { Dueno } from '../types';

import { AvatarIniciales } from './AvatarIniciales';

interface FilaDuenoProps {
  dueno: Dueno;
  esYo: boolean;
  /** Sin esto no aparece "Sacar": uno mismo, o el unico dueno. */
  onSacar?: (dueno: Dueno) => void;
}

/** Un dueno de la marca. Todos iguales: la fila no dice quien la creo. */
export function FilaDueno({ dueno, esYo, onSacar }: FilaDuenoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const secundario = [dueno.dni ? `DNI ${conPuntos(dueno.dni)}` : null, dueno.email]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.fila}>
      <AvatarIniciales nombre={dueno.nombre} imagen={dueno.avatar} />
      <View style={styles.textos}>
        <View style={styles.nombre}>
          <Text variant="body" weight="medium" numberOfLines={1} style={styles.flexible}>
            {dueno.nombre}
          </Text>
          {esYo ? <Badge label="vos" tone="primary" /> : null}
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {secundario}
        </Text>
      </View>
      {onSacar && !esYo ? (
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
