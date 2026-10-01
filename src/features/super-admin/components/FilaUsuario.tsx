import { ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AvatarIniciales } from '@/features/marcas/components';
import { Badge, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { estadoDeCuenta, haceCuanto } from '../formato';
import type { UsuarioEnListado } from '../types';

interface FilaUsuarioProps {
  usuario: UsuarioEnListado;
  onPress: (id: string) => void;
}

/**
 * Una cuenta del listado: quien es, de que marca, en que estado y cuando entro
 * por ultima vez.
 *
 * Memoizada porque el buscador re-renderiza la lista en cada tecla.
 */
function FilaUsuarioComponent({ usuario, onPress }: FilaUsuarioProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const estado = estadoDeCuenta(usuario);

  const acceso = haceCuanto(usuario.ultimoAcceso);
  const secundario = [
    usuario.marca?.nombre ?? 'Sin marca',
    acceso ? `entró ${acceso}` : 'nunca entró',
  ].join(' · ');

  return (
    <Pressable
      onPress={() => onPress(usuario.id)}
      style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
      accessibilityRole="button"
      accessibilityLabel={`${usuario.nombre}, ${usuario.email}, ${estado.etiqueta}, ${secundario}`}
    >
      <AvatarIniciales nombre={usuario.nombre} imagen={usuario.avatar ?? undefined} />
      <View style={styles.datos}>
        <Text variant="body" weight="medium" numberOfLines={1}>
          {usuario.nombre}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {usuario.email}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {secundario}
        </Text>
        <View style={styles.chips}>
          <Badge label={estado.etiqueta} tone={estado.tono} />
          {usuario.proveedor === 'google' ? <Badge label="Google" tone="neutral" /> : null}
        </View>
      </View>
      <ChevronRight size={20} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export const FilaUsuario = memo(FilaUsuarioComponent);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      minHeight: 44,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    presionada: { opacity: 0.7 },
    // `flex: 1` para que un email largo se recorte en vez de empujar la flecha.
    datos: { flex: 1, gap: 2 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, marginTop: 2 },
  });
